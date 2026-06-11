import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  feedbackAnalyses,
  feedbackItems,
  ingestRuns,
  userSettings,
  userSources,
} from "@/db/schema";
import {
  GITHUB_MAX_RETRIES,
  GITHUB_PER_PAGE,
  GITHUB_RETRY_BASE_DELAY_MS,
  HIGH_SEVERITY_THRESHOLD,
  LLM_MAX_RETRIES,
  MAX_RAW_CONTENT_LENGTH,
} from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { analyzeFeedback } from "@/lib/llm";
import { notifyHighSeverityFeedback } from "@/lib/services/notification-service";
import { isLLMProvider, type LLMProvider } from "@/lib/types";

interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

async function fetchGithubPage(
  repo: string,
  page: number,
  token?: string,
): Promise<{ issues: GithubIssue[]; rawCount: number }> {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&type=issues&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "feedbackflow-ai",
      Accept: "application/vnd.github+json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return { issues: [], rawCount: 0 };
  return { issues: data, rawCount: data.length };
}

async function fetchGithubPageWithRetry(
  repo: string,
  page: number,
  token?: string,
): Promise<{ issues: GithubIssue[]; rawCount: number }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= GITHUB_MAX_RETRIES; attempt++) {
    try {
      return await fetchGithubPage(repo, page, token);
    } catch (err) {
      lastErr = err;
      if (attempt < GITHUB_MAX_RETRIES)
        await new Promise((r) => setTimeout(r, GITHUB_RETRY_BASE_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function fetchGithubIssues(repo: string, token?: string): Promise<GithubIssue[]> {
  const results: GithubIssue[] = [];
  for (let page = 1; ; page++) {
    try {
      const { issues, rawCount } = await fetchGithubPageWithRetry(repo, page, token);
      if (!rawCount) break;
      results.push(...issues);
      if (rawCount < GITHUB_PER_PAGE) break;
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
  }
  return results;
}

type LLMOpts = { provider: LLMProvider; model?: string; apiKey: string } | undefined;

export type IngestEvent =
  | { stage: "fetching"; message: string }
  | { stage: "analyzing"; message: string }
  | { stage: "analysis_ok"; message: string }
  | { stage: "analysis_error"; message: string }
  | { stage: "complete"; message: string }
  | { stage: "error"; message: string };

type OnProgress = (event: IngestEvent) => void;

async function getUserLLMOpts(userId: string): Promise<LLMOpts> {
  const [s] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (!s || !isLLMProvider(s.provider) || !s.apiKeyCipher) return undefined;
  return {
    provider: s.provider,
    apiKey: decrypt(s.apiKeyCipher),
    ...(s.model && { model: s.model }),
  };
}

async function analyzeAndStore(
  items: { id: string; rawContent: string }[],
  userId: string,
  llmOpts: LLMOpts,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<number> {
  let count = 0;
  for (const item of items) {
    if (signal?.aborted) break;
    onProgress?.({ stage: "analyzing", message: `analyzing ${count + 1}/${items.length}...` });
    try {
      const a = await analyzeFeedback(item.rawContent, LLM_MAX_RETRIES, llmOpts);
      const analysisData = {
        sentiment: a.sentiment,
        topics: a.topics,
        severityScore: a.severity_score,
        summary: a.summary,
      };
      await db
        .insert(feedbackAnalyses)
        .values({ userId, feedbackItemId: item.id, ...analysisData })
        .onConflictDoUpdate({ target: feedbackAnalyses.feedbackItemId, set: analysisData });
      count++;
      onProgress?.({ stage: "analysis_ok", message: `analyzed ${count}/${items.length}` });
      if (a.severity_score >= HIGH_SEVERITY_THRESHOLD)
        await notifyHighSeverityFeedback(userId, { ...a, status: "New" });
    } catch (err) {
      const msg = String(err)
        .replace(/^Error:\s*/, "")
        .slice(0, 200);
      console.error(`[Ingest] Failed to analyze ${item.id}:`, msg);
      onProgress?.({ stage: "analysis_error", message: `failed: ${msg}` });
      if (/credits|quota|per.?day|unauthorized|invalid.api.key/i.test(msg)) break;
    }
  }
  return count;
}

export async function runIngest(
  onProgress?: OnProgress,
  signal?: AbortSignal,
  scopedUserId?: string,
): Promise<{ fetched: number; inserted: number; analyzed: number }> {
  const query = db
    .select({
      id: userSources.id,
      userId: userSources.userId,
      type: userSources.type,
      config: userSources.config,
      secretCipher: userSources.secretCipher,
    })
    .from(userSources)
    .where(
      scopedUserId
        ? and(eq(userSources.enabled, true), eq(userSources.userId, scopedUserId))
        : eq(userSources.enabled, true),
    );

  const sources = await query;
  const totals = { fetched: 0, inserted: 0, analyzed: 0 };
  const llmOptsCache = new Map<string, LLMOpts>();

  for (const src of sources) {
    if (signal?.aborted) break;
    if (src.type !== "github") continue;

    if (!llmOptsCache.has(src.userId))
      llmOptsCache.set(src.userId, await getUserLLMOpts(src.userId));
    const llmOpts = llmOptsCache.get(src.userId);

    const token = src.secretCipher ? decrypt(src.secretCipher) : undefined;
    onProgress?.({ stage: "fetching", message: `fetching from ${src.config.repo}...` });

    const issues = await fetchGithubIssues(src.config.repo, token);
    onProgress?.({ stage: "fetching", message: `fetched ${issues.length} items` });

    const rows = issues.map((i) => ({
      userId: src.userId,
      source: "github" as const,
      externalId: String(i.id),
      rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, MAX_RAW_CONTENT_LENGTH),
      originalTimestamp: new Date(i.created_at),
    }));

    const inserted = rows.length
      ? await db
          .insert(feedbackItems)
          .values(rows)
          .onConflictDoNothing()
          .returning({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
      : [];

    const [run] = await db
      .insert(ingestRuns)
      .values({ userId: src.userId, fetched: issues.length })
      .returning({ id: ingestRuns.id });

    const insertedIds = new Set(inserted.map((i) => i.id));
    const fetchedExternalIds = rows.map((r) => r.externalId);

    let unanalyzed: { id: string; rawContent: string }[] = [];
    if (fetchedExternalIds.length > 0) {
      unanalyzed = await db
        .select({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
        .from(feedbackItems)
        .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
        .where(
          and(
            eq(feedbackItems.userId, src.userId),
            eq(feedbackItems.source, "github"),
            inArray(feedbackItems.externalId, fetchedExternalIds),
            isNull(feedbackAnalyses.id),
          ),
        );
    }

    const toAnalyze = [...inserted, ...unanalyzed.filter((u) => !insertedIds.has(u.id))];

    if (toAnalyze.length > 0) {
      onProgress?.({ stage: "analyzing", message: `analyzing ${toAnalyze.length} items...` });
    }

    const analyzed = await analyzeAndStore(toAnalyze, src.userId, llmOpts, onProgress, signal);

    await db.update(userSources).set({ lastChecked: new Date() }).where(eq(userSources.id, src.id));

    if (run) {
      await db
        .update(ingestRuns)
        .set({ ok: true, finishedAt: new Date(), inserted: inserted.length, analyzed })
        .where(eq(ingestRuns.id, run.id));
    }

    totals.fetched += issues.length;
    totals.inserted += inserted.length;
    totals.analyzed += analyzed;
  }
  return totals;
}
