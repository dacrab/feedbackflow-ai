import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { rateLimitMiddleware, requireCronOrAuth } from "@/lib/api";
import { runDigest } from "@/lib/services/digest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const rl = rateLimitMiddleware(req, "digest");
  if (rl) return rl;

  const authError = await requireCronOrAuth(req);
  if (authError) return authError;

  try {
    const result = await runDigest();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    Sentry.captureException(e, { extra: { context: "api-digest" } });
    return NextResponse.json(
      { error: "digest failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
