import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { HOURS_IN_DAY } from "@/lib/constants";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { getDateNHoursAgo, isValidCronRequest, notifySlack, requireAuth } from "@/lib/utils";

export async function GET(req: Request) {
  if (!isValidCronRequest(req)) {
    await requireAuth();
  }

  const since = getDateNHoursAgo(HOURS_IN_DAY);

  const rows = await db
    .select({ userId: userNotifications.userId })
    .from(userNotifications)
    .where(eq(userNotifications.enabled, true));

  const userIds = [...new Set(rows.map((u) => u.userId as string))];

  let total = 0;
  let totalHigh = 0;

  for (const userId of userIds) {
    try {
      const result = await sendDailyDigest(userId, since);
      total += result.total;
      totalHigh += result.high;
    } catch {
      // Continue on error
    }
  }

  if (total > 0) {
    await notifySlack(`Daily digest (aggregate): total ${total}, high ${totalHigh}.`);
  }

  return NextResponse.json({ ok: true, total, high: totalHigh, notified: userIds.length });
}
