import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";
import { sendDailyDigest } from "@/lib/services/notification-service";
import { getDateNHoursAgo } from "@/lib/utils";

export const maxDuration = 300;

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`cron:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  if (!isValidCronRequest(req)) await requireAuth();

  let ingest = { fetched: 0, inserted: 0, analyzed: 0 };
  try {
    ingest = await runIngest();
  } catch (e) {
    console.error("Ingest failed:", e);
  }

  let total = 0;
  let high = 0;
  try {
    const since = getDateNHoursAgo(24);
    const userIds = await db
      .selectDistinct({ userId: userNotifications.userId })
      .from(userNotifications)
      .where(eq(userNotifications.enabled, true));

    for (const { userId } of userIds) {
      try {
        const r = await sendDailyDigest(userId, since);
        total += r.total;
        high += r.high;
      } catch (e) {
        console.error(`Digest failed for user ${userId}:`, e);
      }
    }
  } catch (e) {
    console.error("Digest failed:", e);
  }

  return NextResponse.json({ ok: true, ingest, digest: { total, high } });
}
