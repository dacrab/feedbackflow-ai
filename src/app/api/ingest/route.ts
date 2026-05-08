import { NextResponse } from "next/server";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

async function handle(req: Request) {
  if (!isValidCronRequest(req)) await requireAuth();
  try {
    return NextResponse.json(await runIngest());
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = handle;
export const GET = handle;
