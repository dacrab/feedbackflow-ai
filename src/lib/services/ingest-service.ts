import "server-only";

import * as Sentry from "@sentry/nextjs";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
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
import { type FeedbackAnalysisData, isLLMProvider, type LLMProvider } from "@/lib/types";
import { withRetry } from "@/lib/utils";

const ACTIVE_RUN_WINDOW_MS = 10 * 60 * 1000;

interface GithubIssue {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
}

function isRealIssue(issue: GithubIssue): boolean {
  // The issues endpoint also returns pull requests (they carry this key).
  return !("pull_request" in issue);
}

async function fetchGithubPage(repo: string, page: number, token?: string): Promise<GithubIssue[]> {
  const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${GITHUB_PER_PAGE}&page=${page}&sort=updated&direction=desc`;
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
      results.push(...issues.filter(isRealIssue));
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
): Promise<{ count: number; hasError: boolean; highSeverity: FeedbackAnalysisData[] }> {
  // Bail out once instead of looping every unanalyzed item with a
  // per-item "LLM not configured" error.
  if (!llmOpts?.apiKey) {
    onProgress?.({
      stage: "analysis_error",
      message: "LLM not configured. Set your provider and API key in Settings.",
    });
    return { count: 0, hasError: true, highSeverity: [] };
  }

  let count = 0;
  let hasError = false;
  const highSeverity: FeedbackAnalysisData[] = [];

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
      if (a.severity_score >= HIGH_SEVERITY_THRESHOLD) {
        highSeverity.push({ ...a, status: "New" });
      }
    } catch (err) {
      const msg = String(err).replace(/^Error:\s*/, "");
      Sentry.captureException(err, { extra: { context: "ingest-analyze", itemId: item.id } });
      onProgress?.({ stage: "analysis_error", message: `failed: ${msg}` });
      if (/credits|quota|per.?day|unauthorized|invalid.api.key/i.test(msg)) {
        hasError = true;
        break;
      }
    }
  }
  return { count, hasError, highSeverity };
}

export interface RunIngestOptions {
  onProgress?: OnProgress;
  signal?: AbortSignal;
  userId?: string;
  sourceId?: string;
  maxItems?: number;
}

export async function runIngest(
  options: RunIngestOptions = {},
): Promise<{ fetched: number; inserted: number; analyzed: number }> {
  const { onProgress, signal, userId: scopedUserId, sourceId, maxItems } = options;
  const conditions = [eq(userSources.enabled, true)];
  if (scopedUserId) conditions.push(eq(userSources.userId, scopedUserId));
  if (sourceId) conditions.push(eq(userSources.id, sourceId));

  const sources = await db
    .select({
      id: userSources.id,
      userId: userSources.userId,
      type: userSources.type,
      config: userSources.config,
      secretCipher: userSources.secretCipher,
    })
    .from(userSources)
    .where(and(...conditions));
  const githubByUser = new Map<string, Array<(typeof sources)[number]>>();
  for (const src of sources) {
    if (src.type !== "github") continue;
    const list = githubByUser.get(src.userId) ?? [];
    list.push(src);
    githubByUser.set(src.userId, list);
  }

  const totals = { fetched: 0, inserted: 0, analyzed: 0 };

  for (const [userId, userSourceList] of githubByUser) {
    if (signal?.aborted) break;

    // Reclaim runs abandoned by killed invocations first: their unfinished
    // rows would otherwise trip the partial unique index forever. Only then
    // does an unfinished row reliably mean a live concurrent sync.
    await db
      .update(ingestRuns)
      .set({ finishedAt: new Date(), ok: false })
      .where(
        and(
          eq(ingestRuns.userId, userId),
          isNull(ingestRuns.finishedAt),
          lt(ingestRuns.startedAt, new Date(Date.now() - ACTIVE_RUN_WINDOW_MS)),
        ),
      );

    // Concurrency guard: skip if a run for this user is still active (covers
    // overlapping cron + manual sync + addSource-triggered ingests). The
    // unique partial index on active runs is the authoritative backstop for
    // the check-then-insert race.
    const [active] = await db
      .select({ id: ingestRuns.id })
      .from(ingestRuns)
      .where(and(eq(ingestRuns.userId, userId), isNull(ingestRuns.finishedAt)))
      .limit(1);
    if (active) {
      onProgress?.({ stage: "error", message: "a sync is already running — try again shortly" });
      continue;
    }

    let runId: string | null = null;
    try {
      const [run] = await db
        .insert(ingestRuns)
        .values({ userId, fetched: 0 })
        .returning({ id: ingestRuns.id });
      runId = run?.id ?? null;
    } catch {
      // Unique violation on the active-run index means another sync slipped
      // in between the check and insert. Skip this user instead of failing.
      onProgress?.({ stage: "error", message: "a sync is already running — try again shortly" });
      continue;
    }

    const llmOpts = await getUserLLMOpts(userId);

    let fetched = 0;
    let inserted = 0;
    let analyzed = 0;
    let hasError = false;

    try {
      for (const src of userSourceList) {
        if (signal?.aborted) break;

        const token = src.secretCipher ? decrypt(src.secretCipher) : undefined;
        onProgress?.({ stage: "fetching", message: `fetching from ${src.config.repo}...` });

        const issues = await fetchGithubIssues(src.config.repo, token);
        onProgress?.({ stage: "fetching", message: `fetched ${issues.length} items` });
        fetched += issues.length;

        const rows = issues.map((i) => ({
          userId: src.userId,
          source: "github" as const,
          externalId: String(i.id),
          rawContent: `${i.title}\n\n${i.body ?? ""}`.slice(0, MAX_RAW_CONTENT_LENGTH),
          originalTimestamp: new Date(i.created_at),
        }));

        const insertedRows = rows.length
          ? await db
              .insert(feedbackItems)
              .values(rows)
              .onConflictDoNothing()
              .returning({ id: feedbackItems.id })
          : [];
        inserted += insertedRows.length;

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

        // Cap the per-invocation analysis workload (used by the detached
        // addSource ingest); leftovers are picked up by cron/manual sync.
        const toAnalyze = maxItems !== undefined ? unanalyzed.slice(0, maxItems) : unanalyzed;

        if (toAnalyze.length > 0) {
          onProgress?.({ stage: "analyzing", message: `analyzing ${toAnalyze.length} items...` });
        }

        const {
          count,
          hasError: itemError,
          highSeverity,
        } = await analyzeAndStore(toAnalyze, src.userId, llmOpts, onProgress, signal);
        analyzed += count;
        if (itemError) hasError = true;

        // Fire notifications in one batched pass after the per-item loop so a
        // slow Slack webhook can't stall analysis of subsequent items.
        if (highSeverity.length > 0) {
          await Promise.allSettled(highSeverity.map((a) => notifyHighSeverityFeedback(userId, a)));
        }

        await db
          .update(userSources)
          .set({ lastChecked: new Date() })
          .where(eq(userSources.id, src.id));
      }
    } finally {
      if (runId) {
        await db
          .update(ingestRuns)
          .set({
            ok: !hasError,
            finishedAt: new Date(),
            fetched,
            inserted,
            analyzed,
          })
          .where(eq(ingestRuns.id, runId));
      }
    }

    totals.fetched += fetched;
    totals.inserted += inserted;
    totals.analyzed += analyzed;
  }
  return totals;
}
