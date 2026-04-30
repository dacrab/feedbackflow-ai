import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { getDateNHoursAgo, notifySlack } from "@/lib/utils";

export async function GET(req: Request) {
  if (!isValidCronRequest(req)) await requireAuth();

  let ingest = { fetched: 0, inserted: 0, analyzed: 0 };
  let digest = { total: 0, high: 0, notified: 0 };

  try {
    ingest = await runIngest();
  } catch (e) {
    console.error("Ingest failed:", e);
  }

  try {
    const since = getDateNHoursAgo(24);
    const rows = await db
      .select({ userId: userNotifications.userId })
      .from(userNotifications)
      .where(eq(userNotifications.enabled, true));

    const userIds = [...new Set(rows.map((u) => u.userId as string))];
    let total = 0;
    let high = 0;

    for (const userId of userIds) {
      try {
        const result = await sendDailyDigest(userId, since);
        total += result.total;
        high += result.high;
      } catch {
        // Continue on error
      }
    }

    if (total > 0) await notifySlack(`Daily digest: ${total} total, ${high} high severity`);
    digest = { total, high, notified: userIds.length };
  } catch (e) {
    console.error("Digest failed:", e);
  }

  return NextResponse.json({ ok: true, ingest, digest });
}
