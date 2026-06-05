import { NextResponse } from "next/server";
import { requireCronOrAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runDigest } from "@/lib/services/digest-service";
import { runIngest } from "@/lib/services/ingest-service";

export const maxDuration = 300;

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`cron:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!success)
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );

  const authError = await requireCronOrAuth(req);
  if (authError) return authError;

  const [ingest, digest] = await Promise.allSettled([runIngest(), runDigest()]);

  return NextResponse.json({
    ok: true,
    ingest: ingest.status === "fulfilled" ? ingest.value : { error: String(ingest.reason) },
    digest: digest.status === "fulfilled" ? digest.value : { error: String(digest.reason) },
  });
}
