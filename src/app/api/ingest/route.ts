import { NextResponse } from "next/server";
import { isValidCronRequest, requireAuth } from "@/lib/api";
import { runIngest } from "@/lib/services/ingest-service";

export const maxDuration = 300;

async function handle(req: Request) {
  if (!isValidCronRequest(req)) await requireAuth();
  try {
    return NextResponse.json(await runIngest());
  } catch (e: unknown) {
    console.error("[Ingest]", e);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}

export { handle as GET, handle as POST };
