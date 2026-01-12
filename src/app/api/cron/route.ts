import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { getDateNHoursAgo, notifySlack } from "@/lib/utils";

export async function GET(req: Request) {
  if (!isValidCronRequest(req)) {
    await requireAuth();
  }

  const results: {
    ingest: { fetched: number; inserted: number; analyzed: number } | { error: string };
    digest: { total: number; high: number; notified: number } | { error: string };
  } = {
    ingest: { fetched: 0, inserted: 0, analyzed: 0 },
    digest: { total: 0, high: 0, notified: 0 },
  };

  try {
    results.ingest = await runIngest();
  } catch (e: unknown) {
    results.ingest = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const since = getDateNHoursAgo(24);
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

    results.digest = { total, high: totalHigh, notified: userIds.length };
  } catch (e: unknown) {
    results.digest = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ ok: true, ...results });
}
