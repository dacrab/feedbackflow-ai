import { NextResponse } from "next/server";
import { rateLimitMiddleware, requireCronOrAuth } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/constants";
import { runDigest } from "@/lib/services/digest-service";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const rl = await rateLimitMiddleware(req, "cron", RATE_LIMITS.cron);
  if (rl) return rl;

  const authError = await requireCronOrAuth(req);
  if (authError) return authError;

  const [ingest, digest] = await Promise.allSettled([runIngest(), runDigest()]);

  return NextResponse.json({
    ok: true,
    ingest: ingest.status === "fulfilled" ? ingest.value : { error: String(ingest.reason) },
    digest: digest.status === "fulfilled" ? digest.value : { error: String(digest.reason) },
  });
}
