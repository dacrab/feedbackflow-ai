import "server-only";

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { DIGEST_WINDOW_HOURS } from "@/lib/constants";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { hoursAgo } from "@/lib/utils";

// Bounded batches: an unbounded fan-out is thousands of concurrent Neon
// requests on one cron hit.
const USER_BATCH_SIZE = 10;

export interface DigestResult {
  total: number;
  high: number;
  failed: number;
}

export async function runDigest(): Promise<DigestResult> {
  const since = hoursAgo(DIGEST_WINDOW_HOURS);
  const userIds = await db
    .selectDistinct({ userId: userNotifications.userId })
    .from(userNotifications)
    .where(eq(userNotifications.enabled, true));

  const totals: DigestResult = { total: 0, high: 0, failed: 0 };

  for (let i = 0; i < userIds.length; i += USER_BATCH_SIZE) {
    const batch = userIds.slice(i, i + USER_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(({ userId }) => sendDailyDigest(userId, since)),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        totals.failed++;
        Sentry.captureException(result.reason, { extra: { context: "digest" } });
        continue;
      }
      totals.total += result.value.total;
      totals.high += result.value.high;
    }
  }

  return totals;
}
