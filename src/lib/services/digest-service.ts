import "server-only";

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { getDateNHoursAgo } from "@/lib/utils";

export async function runDigest(): Promise<{ total: number; high: number }> {
  const since = getDateNHoursAgo(24);
  const userIds = await db
    .selectDistinct({ userId: userNotifications.userId })
    .from(userNotifications)
    .where(eq(userNotifications.enabled, true));

  let total = 0;
  let high = 0;
  for (const { userId } of userIds) {
    try {
      const r = await sendDailyDigest(userId, since);
      total += r.total;
      high += r.high;
    } catch (e) {
      Sentry.captureException(e, { extra: { context: "digest", userId } });
    }
  }
  return { total, high };
}
