import "server-only";

import { lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { ingestRuns, rateLimits } from "@/db/schema";
import { RATE_LIMITS } from "@/lib/constants";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const CLEANUP_P = 0.01;

const MAX_WINDOW_MS = Math.max(...Object.values(RATE_LIMITS).map((config) => config.windowMs));

async function deleteStale(cutoff: Date) {
  await db.delete(rateLimits).where(lt(rateLimits.windowStartedAt, cutoff));
}

// Deterministic eviction; the 1% sweep in rateLimit() needs traffic to fire.
// Both share one cutoff: a per-bucket cutoff would reset longer windows.
export async function sweepExpired(): Promise<void> {
  await deleteStale(new Date(Date.now() - MAX_WINDOW_MS));
}

/** Runs older than this can never be the "last run" anyone looks at. */
export async function pruneOldRuns(retentionMs: number): Promise<void> {
  await db.delete(ingestRuns).where(lt(ingestRuns.startedAt, new Date(Date.now() - retentionMs)));
}

export async function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: RateLimitConfig,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  if (Math.random() < CLEANUP_P) {
    await sweepExpired();
  }

  // One atomic upsert per key: a bucket past its window resets to 1/now,
  // otherwise it increments in place, so concurrent callers cannot race past
  // the cap.
  const [row] = await db
    .insert(rateLimits)
    .values({ key: identifier, windowStartedAt: now, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStartedAt} < ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${rateLimits.windowStartedAt} < ${windowStart} THEN ${now} ELSE ${rateLimits.windowStartedAt} END`,
      },
    })
    .returning({ count: rateLimits.count });

  return (row?.count ?? 1) <= maxRequests;
}
