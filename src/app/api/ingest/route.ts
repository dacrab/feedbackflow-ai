import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { rateLimitMiddleware, requireCronOrAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const rl = await rateLimitMiddleware(req, "ingest");
  if (rl) return rl;

  const authError = await requireCronOrAuth(req);
  if (authError) return authError;

  try {
    const result = await runIngest();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    Sentry.captureException(e, { extra: { context: "api-ingest" } });
    return NextResponse.json(
      { error: "ingest failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
