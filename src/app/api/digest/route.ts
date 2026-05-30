import { NextResponse } from "next/server";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { runDigest } from "@/lib/services/digest-service";

export const maxDuration = 300;

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`digest:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!success)
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );

  if (!isValidCronRequest(req)) {
    try {
      await requireAuth();
    } catch (e) {
      return e as Response;
    }
  }

  try {
    const result = await runDigest();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Digest failed:", e);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
