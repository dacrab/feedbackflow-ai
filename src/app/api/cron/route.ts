import { NextResponse } from "next/server";
import { rateLimitMiddleware, requireCron } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/constants";
import { sweepExpired } from "@/lib/rate-limit";
import { runDigest } from "@/lib/services/digest-service";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  // Vercel cron attaches `Authorization: Bearer $CRON_SECRET` automatically.
  // Fail closed: without a matching secret (or x-cron-token) this endpoint
  // refuses to run, so an authenticated user can no longer trigger a
  // platform-wide ingest/digest for every tenant.
  const authError = requireCron(req);
  if (authError) return authError;

  const rl = await rateLimitMiddleware(req, "cron", RATE_LIMITS.cron);
  if (rl) return rl;

  // Deterministic eviction of rate-limit rows orphaned by one-off visitors;
  // the random 1% sweep in rateLimit() only fires on traffic.
  await sweepExpired();

  const [ingest, digest] = await Promise.allSettled([runIngest({}), runDigest()]);

  return NextResponse.json({
    ok: true,
    ingest: ingest.status === "fulfilled" ? ingest.value : { error: String(ingest.reason) },
    digest: digest.status === "fulfilled" ? digest.value : { error: String(digest.reason) },
  });
}
