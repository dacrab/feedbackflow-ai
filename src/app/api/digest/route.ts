import { NextResponse } from "next/server";
import { notifySlack } from "@/lib/notify";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { getDateNHoursAgo } from "@/lib/utils/date";

export async function GET(req: Request) {
  const cron = req.headers.get("x-cron-token");
  if (cron !== process.env["CRON_TOKEN"]) {
    const supa = await createServerClient();
    const { data: auth } = await supa.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = getDateNHoursAgo(24);

  // Get all users with enabled notifications
  const { data: users, error: usersErr } = await admin
    .from("user_notifications")
    .select("user_id")
    .eq("enabled", true);

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  // Get unique user IDs
  const userIds = [...new Set((users || []).map((u) => u.user_id as string))];

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
