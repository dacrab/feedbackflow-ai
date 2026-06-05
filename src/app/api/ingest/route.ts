import { NextResponse } from "next/server";
import { requireCronOrAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";

export const maxDuration = 300;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`ingest:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const authError = await requireCronOrAuth(req);
  if (authError) return authError;

  try {
    const result = await runIngest();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[Ingest]", e);
    return NextResponse.json(
      { error: "ingest failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
