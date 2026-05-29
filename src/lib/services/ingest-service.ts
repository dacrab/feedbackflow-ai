import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  feedbackAnalyses,
  feedbackItems,
  ingestRuns,
  userSettings,
  userSources,
} from "@/db/schema";
import {
  DEFAULT_ANALYSIS_BATCH_SIZE,
  HIGH_SEVERITY_THRESHOLD,
  INITIAL_FETCH_DAYS,
  MAX_RAW_CONTENT_LENGTH,
  OPENROUTER_ANALYSIS_BATCH_SIZE,
} from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { analyzeFeedback } from "@/lib/llm";
import { notifyHighSeverityFeedback } from "@/lib/services/notification-service";
import { isLLMProvider, type LLMProvider } from "@/lib/types";
import { getDateNHoursAgo } from "@/lib/utils";
import { fetchGithubIssues } from "./github-service";

type LLMOpts = { provider: LLMProvider; model?: string; apiKey?: string } | undefined;

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
  if (!s || !isLLMProvider(s.provider)) return undefined;
  const apiKey = s.apiKeyCipher ? decrypt(s.apiKeyCipher) : undefined;
  return { provider: s.provider, ...(s.model && { model: s.model }), ...(apiKey && { apiKey }) };
}

const LLM_THROTTLE_MS = 3500;

async function analyzeAndStore(
  items: { id: string; rawContent: string }[],
  userId: string,
  llmOpts: LLMOpts,
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<number> {
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) break;
    if (count > 0) await new Promise((r) => setTimeout(r, LLM_THROTTLE_MS));
    const item = items[i];
    if (!item) continue;
    onProgress?.({ stage: "analyzing", message: `analyzing ${i + 1}/${items.length}...` });
    try {
      const a = await analyzeFeedback(item.rawContent, 2, llmOpts);
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
      const msg = String(err).replace(/^Error:\s*/, "").slice(0, 200);
      console.error(`[Ingest] Failed to analyze ${item.id}:`, msg);
      onProgress?.({ stage: "analysis_error", message: `failed: ${msg}` });
      // Abort the whole batch on unrecoverable errors (quota, credits, auth)
      const fatal = /credits|quota|per.day|unauthorized|invalid.api.key/i.test(msg);
      if (fatal) break;
    }
  }
  return count;
}

export async function runIngest(
  onProgress?: OnProgress,
  signal?: AbortSignal,
): Promise<{ fetched: number; inserted: number; analyzed: number }> {
  const sources = await db
    .select({
      id: userSources.id,
      userId: userSources.userId,
      type: userSources.type,
      config: userSources.config,
      secretCipher: userSources.secretCipher,
    })
    .from(userSources)
    .where(eq(userSources.enabled, true));

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

    const [latest] = await db
      .select({ ts: feedbackItems.originalTimestamp })
      .from(feedbackItems)
      .where(and(eq(feedbackItems.userId, src.userId), eq(feedbackItems.source, "github")))
      .orderBy(desc(feedbackItems.originalTimestamp))
      .limit(1);
    const sinceISO = latest?.ts
      ? new Date(latest.ts).toISOString()
      : getDateNHoursAgo(24 * INITIAL_FETCH_DAYS);

    const issues = await fetchGithubIssues(src.config.repo, sinceISO, token);

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
    const batchSize = llmOpts?.provider === "openrouter" ? OPENROUTER_ANALYSIS_BATCH_SIZE : DEFAULT_ANALYSIS_BATCH_SIZE;
    const unanalyzed = await db
      .select({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
      .from(feedbackItems)
      .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
      .where(and(eq(feedbackItems.userId, src.userId), isNull(feedbackAnalyses.id)))
      .limit(batchSize);

    const toAnalyze = [...inserted, ...unanalyzed.filter((u) => !insertedIds.has(u.id))].slice(
      0,
      batchSize,
    );

    if (toAnalyze.length > 0) {
      onProgress?.({ stage: "analyzing", message: `analyzing ${toAnalyze.length} items...` });
    }

    const analyzed = await analyzeAndStore(toAnalyze, src.userId, llmOpts, onProgress, signal);

    if (run?.id)
      await db
        .update(ingestRuns)
        .set({ ok: true, finishedAt: new Date(), inserted: inserted.length, analyzed })
        .where(eq(ingestRuns.id, run.id));

    totals.fetched += issues.length;
    totals.inserted += inserted.length;
    totals.analyzed += analyzed;
  }
  return totals;
}
