import { NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { notifySlack, notifySlackTo } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const cron = req.headers.get("x-cron-token");
  if (cron !== process.env["CRON_TOKEN"]) {
    const supa = await createServerClient();
    const { data: auth } = await supa.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Per-user notifications
  const { data: users, error: usersErr } = await admin
    .from("user_notifications")
    .select("user_id, type, secret_cipher, enabled")
    .eq("enabled", true);
  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  let total = 0;
  let totalHigh = 0;
  const notified: Array<{ user_id: string; total: number; high: number }> = [];

  const byUser = new Map<string, string[]>();
  for (const row of users || []) {
    if (row.type !== "slack" || !row.secret_cipher) continue;
    const arr = byUser.get(row.user_id as string) || [];
    arr.push(row.secret_cipher as string);
    byUser.set(row.user_id as string, arr);
  }

  for (const [userId, secrets] of byUser.entries()) {
    const { data, error } = await admin
      .from("feedback_analyses")
      .select("summary, severity_score, sentiment, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (error) continue;

    const high = (data || []).filter((d) => d.severity_score >= 4);
    total += data?.length ?? 0;
    totalHigh += high.length;
    const summary = `Daily digest: ${data?.length ?? 0} analyses in last 24h. High severity: ${high.length}.`;
    for (const sc of secrets) {
      try {
        const real = decrypt(sc as string);
        if (real) {
          await notifySlackTo(real, summary);
          for (const h of high.slice(0, 10)) {
            await notifySlackTo(real, `• [sev ${h.severity_score}] ${h.summary}`);
          }
        }
      } catch {}
    }
    notified.push({
      user_id: userId,
      total: data?.length ?? 0,
      high: high.length,
    });
  }

  // Fallback to global webhook if configured
  if (total > 0) {
    await notifySlack(`Daily digest (aggregate): total ${total}, high ${totalHigh}.`);
  }

  return NextResponse.json({ ok: true, total, high: totalHigh, notified });
}
