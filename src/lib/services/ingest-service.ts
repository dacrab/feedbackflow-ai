import "server-only";

import * as Sentry from "@sentry/nextjs";
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
import { withRetry } from "@/lib/utils";

interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

async function fetchGithubPage(repo: string, page: number, token?: string): Promise<GithubIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&type=issues&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "feedbackflow-ai",
      Accept: "application/vnd.github+json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchGithubPageWithRetry(repo: string, page: number, token?: string) {
  return withRetry(() => fetchGithubPage(repo, page, token), {
    retries: GITHUB_MAX_RETRIES,
    baseDelay: GITHUB_RETRY_BASE_DELAY_MS,
  });
}

async function fetchGithubIssues(repo: string, token?: string): Promise<GithubIssue[]> {
  const results: GithubIssue[] = [];
  for (let page = 1; ; page++) {
    try {
      const issues = await fetchGithubPageWithRetry(repo, page, token);
      if (!issues.length) break;
      results.push(...issues);
      if (issues.length < GITHUB_PER_PAGE) break;
    } catch (e) {
      if (page === 1) throw e; // nothing fetched yet, so fail loudly
      break; // keep partial results on later-page failures
    }
  }
  return results;
}

type LLMOpts = { provider: LLMProvider; model: string; apiKey: string } | undefined;

type IngestEvent =
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
  if (!s || !isLLMProvider(s.provider) || !s.apiKeyCipher || !s.model) return undefined;
  return {
    provider: s.provider,
    apiKey: decrypt(s.apiKeyCipher),
    model: s.model,
  };
}

async function analyzeAndStore(
  items: { id: string; rawContent: string }[],
  userId: string,
  llmOpts: LLMOpts,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<{ count: number; hasError: boolean }> {
  let count = 0;
  let hasError = false;
  for (const item of items) {
    if (signal?.aborted) break;
    onProgress?.({ stage: "analyzing", message: `analyzing ${count + 1}/${items.length}...` });
    try {
      const a = await analyzeFeedback(item.rawContent, LLM_MAX_RETRIES, llmOpts, userId, signal);
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
      Sentry.captureException(err, { extra: { context: "ingest-analyze", itemId: item.id } });
      onProgress?.({ stage: "analysis_error", message: `failed: ${msg}` });
      if (/credits|quota|per.?day|unauthorized|invalid.api.key/i.test(msg)) {
        hasError = true;
        break;
      }
    }
  }
  return { count, hasError };
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
          .returning({ id: feedbackItems.id })
      : [];

    const [run] = await db
      .insert(ingestRuns)
      .values({ userId: src.userId, fetched: issues.length })
      .returning({ id: ingestRuns.id });

    const fetchedExternalIds = rows.map((r) => r.externalId);

    const unanalyzed =
      fetchedExternalIds.length > 0
        ? await db
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
            )
        : [];

    if (unanalyzed.length > 0) {
      onProgress?.({ stage: "analyzing", message: `analyzing ${unanalyzed.length} items...` });
    }

    const { count: analyzed, hasError } = await analyzeAndStore(
      unanalyzed,
      src.userId,
      llmOpts,
      onProgress,
      signal,
    );

    await db.update(userSources).set({ lastChecked: new Date() }).where(eq(userSources.id, src.id));

    if (run) {
      await db
        .update(ingestRuns)
        .set({
          ok: !hasError,
          finishedAt: new Date(),
          inserted: inserted.length,
          analyzed,
        })
        .where(eq(ingestRuns.id, run.id));
    }

    totals.fetched += issues.length;
    totals.inserted += inserted.length;
    totals.analyzed += analyzed;
  }
  return totals;
}
