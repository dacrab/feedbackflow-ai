import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { rateLimitResponse, requireCron } from "@/lib/api";
import { RATE_LIMITS, RUN_RETENTION_MS } from "@/lib/constants";
import { pruneOldRuns, sweepExpired } from "@/lib/rate-limit";
import { runDigest } from "@/lib/services/digest-service";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";
// Next extracts this by static analysis that accepts literals only — an
// imported identifier reports "Unknown identifier" and silently falls back to
// the platform default — so 300 stays a literal here and in /api/sync.
export const maxDuration = 300;

// Leaves headroom under maxDuration so the loop exits and finalizeRun runs
// instead of the platform killing the function with the run row unfinished.
const CRON_BUDGET_MS = (maxDuration - 20) * 1000;

export async function GET(req: Request) {
  const authError = requireCron(req);
  if (authError) return authError;

  // Not keyed on IP: Vercel cron uses a rotating platform IP pool.
  const rl = await rateLimitResponse("cron", RATE_LIMITS.cron);
  if (rl) return rl;

  // Deterministic eviction; the 1% sweep in rateLimit() needs traffic to fire.
  await sweepExpired();
  await pruneOldRuns(RUN_RETENTION_MS);

  const [ingest, digest] = await Promise.allSettled([
    runIngest({ signal: AbortSignal.timeout(CRON_BUDGET_MS) }),
    runDigest(),
  ]);

  // runIngest resolves even when individual tenants fail, so the fulfilled
  // check alone would report a green run over a half-failed ingest.
  const ok =
    ingest.status === "fulfilled" &&
    ingest.value.ok &&
    digest.status === "fulfilled" &&
    digest.value.failed === 0;

  if (!ok) {
    Sentry.captureMessage("cron partial failure", {
      level: "warning",
      extra: {
        ingest: ingest.status === "fulfilled" ? ingest.value : String(ingest.reason),
        digest: digest.status === "fulfilled" ? digest.value : String(digest.reason),
      },
    });
  }

  // Unattended: a green 200 with both jobs thrown would hide a broken ingest.
  return NextResponse.json(
    {
      ok,
      ingest: ingest.status === "fulfilled" ? ingest.value : { error: String(ingest.reason) },
      digest: digest.status === "fulfilled" ? digest.value : { error: String(digest.reason) },
    },
    { status: ok ? 200 : 500 },
  );
}
