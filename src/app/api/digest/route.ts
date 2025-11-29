import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { notifySlack } from "@/lib/notify";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { requireAuth } from "@/lib/utils/api";
import { getDateNHoursAgo } from "@/lib/utils/date";

function isValidCronRequest(req: Request): boolean {
  // Check Vercel's cron secret (automatically set in production)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check custom cron token (for manual testing)
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  if (cronToken && token === cronToken) {
    return true;
  }

  return false;
}

export async function GET(req: Request) {
  // Allow if valid cron request; otherwise require auth
  if (!isValidCronRequest(req)) {
    await requireAuth();
  }

  const since = getDateNHoursAgo(24);

  // Get all users with enabled notifications
  const rows = await db
    .select({ userId: userNotifications.userId })
    .from(userNotifications)
    .where(eq(userNotifications.enabled, true));

  // Get unique user IDs
  const userIds = [...new Set(rows.map((u) => u.userId as string))];

  let total = 0;
  let totalHigh = 0;
  const notified: Array<{ user_id: string; total: number; high: number }> = [];

  for (const userId of userIds) {
    try {
      const result = await sendDailyDigest(userId, since);
      total += result.total;
      totalHigh += result.high;
      notified.push({
        user_id: userId,
        total: result.total,
        high: result.high,
      });
    } catch {
      // Continue on error
    }
  }

  // Fallback to global webhook if configured
  if (total > 0) {
    await notifySlack(`Daily digest (aggregate): total ${total}, high ${totalHigh}.`);
  }

  return NextResponse.json({ ok: true, total, high: totalHigh, notified });
}
