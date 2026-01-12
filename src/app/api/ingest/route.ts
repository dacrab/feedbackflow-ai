import { NextResponse } from "next/server";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

export async function POST(req: Request) {
  if (!isValidCronRequest(req)) {
    await requireAuth();
  }

  try {
    const result = await runIngest();
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
