import "server-only";

import { lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const CLEANUP_P = 0.01;

export async function rateLimit(
  identifier: string,
  { maxRequests, windowMs }: RateLimitConfig,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  if (Math.random() < CLEANUP_P) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStartedAt, windowStart));
  }

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
