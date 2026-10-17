import "server-only";

import * as Sentry from "@sentry/nextjs";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses, feedbackItems, userSources } from "@/db/schema";
import { MAX_RAW_CONTENT_LENGTH, SYNC_FAILED_MESSAGE } from "@/lib/constants";
import { tryDecrypt } from "@/lib/crypto";
import type { LLMOptions } from "@/lib/llm";
import { analyzeAndStore, getUserLLMOpts } from "@/lib/services/ingest/analysis";
import { fetchGithubIssues } from "@/lib/services/ingest/github";
import {
  claimRun,
  finalizeRun,
  newStats,
  reclaimStaleRuns,
  type SyncStats,
} from "@/lib/services/ingest/runs";
import { notifyHighSeverityFeedback } from "@/lib/services/notification-service";
import type { OnProgress } from "@/lib/types";

type IngestSourceRow = Pick<
  typeof userSources.$inferSelect,
  "id" | "userId" | "type" | "config" | "secretCipher"
>;

const ALREADY_RUNNING = "a sync is already running — try again shortly";

export interface RunIngestResult {
  users: number;
  fetched: number;
  inserted: number;
  analyzed: number;
  /** False if any tenant hit a fatal provider error, was skipped because a run
   *  was already in flight, or was cancelled. Transient per-item errors do not
   *  flip it. */
  ok: boolean;
}

export interface RunIngestOptions {
  onProgress?: OnProgress;
  signal?: AbortSignal;
  userId?: string;
  sourceId?: string;
  maxItems?: number;
}

async function loadSources(options: RunIngestOptions): Promise<Map<string, IngestSourceRow[]>> {
  const { userId, sourceId } = options;
  const conditions = [eq(userSources.enabled, true)];
  if (userId) conditions.push(eq(userSources.userId, userId));
  if (sourceId) conditions.push(eq(userSources.id, sourceId));

  const rows = await db
    .select({
      id: userSources.id,
      userId: userSources.userId,
      type: userSources.type,
      config: userSources.config,
      secretCipher: userSources.secretCipher,
    })
    .from(userSources)
    .where(and(...conditions));

  const byUser = new Map<string, IngestSourceRow[]>();
  for (const row of rows) {
    byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row]);
  }
  return byUser;
}

async function storeIssues(
  src: IngestSourceRow,
  token: string | undefined,
  emit: OnProgress | undefined,
) {
  emit?.("fetching", `fetching from ${src.config.repo}...`);
  const issues = await fetchGithubIssues(src.config.repo, token);
  emit?.("fetching", `fetched ${issues.length} items`);

  const rows = issues.map((issue) => ({
    userId: src.userId,
    source: src.type,
    // Repo-scoped: GitHub issue ids are unique only within a repo.
    externalId: `${src.config.repo}#${issue.id}`,
    rawContent: `${issue.title}\n\n${issue.body ?? ""}`.slice(0, MAX_RAW_CONTENT_LENGTH),
    originalTimestamp: new Date(issue.created_at),
  }));

  const inserted = rows.length
    ? await db
        .insert(feedbackItems)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: feedbackItems.id })
    : [];

  return {
    fetched: issues.length,
    inserted: inserted.length,
    externalIds: rows.map((r) => r.externalId),
  };
}

async function selectUnanalyzed(src: IngestSourceRow, externalIds: string[]) {
  if (externalIds.length === 0) return [];
  return db
    .select({ id: feedbackItems.id, rawContent: feedbackItems.rawContent })
    .from(feedbackItems)
    .leftJoin(feedbackAnalyses, eq(feedbackItems.id, feedbackAnalyses.feedbackItemId))
    .where(
      and(
        eq(feedbackItems.userId, src.userId),
        eq(feedbackItems.source, src.type),
        inArray(feedbackItems.externalId, externalIds),
        isNull(feedbackAnalyses.id),
      ),
    );
}

async function syncUser(
  userId: string,
  sources: IngestSourceRow[],
  llmOpts: LLMOptions | undefined,
  options: RunIngestOptions,
  stats: SyncStats,
) {
  const { signal, maxItems, onProgress } = options;

  for (const src of sources) {
    if (signal?.aborted) break;

    // A bad token degrades this source; it must not abort the user's sync.
    const token = tryDecrypt(src.secretCipher, "ingest-source-token");
    const done = await storeIssues(src, token, onProgress);
    stats.fetched += done.fetched;
    stats.inserted += done.inserted;

    const unanalyzed = await selectUnanalyzed(src, done.externalIds);
    // maxItems caps the detached addSource ingest; cron takes the rest.
    const pending = maxItems === undefined ? unanalyzed : unanalyzed.slice(0, maxItems);

    if (pending.length > 0) {
      onProgress?.("analyzing", `analyzing ${pending.length} items...`);
    }
    const { count, hasError, highSeverity } = await analyzeAndStore(
      pending,
      userId,
      llmOpts,
      onProgress,
      signal,
    );
    stats.analyzed += count;
    stats.hasError ||= hasError;

    // Batched after the per-item loop, so a slow webhook cannot stall it.
    await notifyHighSeverityFeedback(userId, highSeverity);

    await db
      .update(userSources)
      .set({ lastChecked: new Date() })
      .where(and(eq(userSources.id, src.id), eq(userSources.userId, src.userId)));
  }
}

export async function runIngest(options: RunIngestOptions = {}): Promise<RunIngestResult> {
  const { onProgress, signal } = options;
  const byUser = await loadSources(options);
  const result: RunIngestResult = { users: 0, fetched: 0, inserted: 0, analyzed: 0, ok: true };

  for (const [userId, sources] of byUser) {
    if (signal?.aborted) break;
    result.users++;

    // Reclaim first, or rows from a killed invocation hold the slot forever.
    await reclaimStaleRuns(userId);
    const runId = await claimRun(userId);
    if (!runId) {
      // Skipped, not clean: the caller must not report a green run.
      result.ok = false;
      onProgress?.("error", ALREADY_RUNNING);
      continue;
    }

    const stats = newStats();
    try {
      await syncUser(userId, sources, await getUserLLMOpts(userId), options, stats);
    } catch (err) {
      // One tenant failing (revoked token, deleted repo, rotated encryption
      // key) must not abort every tenant queued behind it.
      stats.hasError = true;
      stats.error = err instanceof Error ? err.message : String(err);
      Sentry.captureException(err, { extra: { context: "run-ingest", userId } });
      onProgress?.("error", SYNC_FAILED_MESSAGE);
    } finally {
      await finalizeRun(runId, stats, signal?.aborted === true);
    }

    result.fetched += stats.fetched;
    result.inserted += stats.inserted;
    result.analyzed += stats.analyzed;
    result.ok &&= !stats.hasError;
  }

  // Work left undone (aborted between tenants, or the platform's deadline) is
  // not a clean run.
  if (signal?.aborted) result.ok = false;

  return result;
}
