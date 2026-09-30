import "server-only";

import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { ingestRuns } from "@/db/schema";
import { ACTIVE_RUN_WINDOW_MS } from "@/lib/constants";

// Filled in place, so the caller can finalize the run row with partial counts.
export interface SyncStats {
  fetched: number;
  inserted: number;
  analyzed: number;
  hasError: boolean;
  /** Why the run ended badly; shown verbatim in Settings. */
  error: string | null;
}

export const newStats = (): SyncStats => ({
  fetched: 0,
  inserted: 0,
  analyzed: 0,
  hasError: false,
  error: null,
});

// Otherwise a killed invocation's unfinished row trips the index forever.
export async function reclaimStaleRuns(userId: string) {
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
}

// The partial unique index on (user_id) WHERE finished_at IS NULL is the lock:
// the insert wins or conflicts, so there is no check-then-insert race.
export async function claimRun(userId: string): Promise<string | null> {
  const [run] = await db
    .insert(ingestRuns)
    .values({ userId })
    .onConflictDoNothing({ target: ingestRuns.userId, where: isNull(ingestRuns.finishedAt) })
    .returning({ id: ingestRuns.id });
  return run?.id ?? null;
}

export async function finalizeRun(runId: string, stats: SyncStats, aborted: boolean) {
  await db
    .update(ingestRuns)
    .set({
      // A cancelled run stopped early, so it is not a successful one.
      ok: !(stats.hasError || aborted),
      error: aborted ? "cancelled" : stats.error,
      finishedAt: new Date(),
      fetched: stats.fetched,
      inserted: stats.inserted,
      analyzed: stats.analyzed,
    })
    .where(eq(ingestRuns.id, runId));
}
