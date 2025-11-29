import { NextResponse } from "next/server";
import { runIngest } from "@/lib/services/ingest-service";

export async function POST(req: Request) {
  const token = req.headers.get("x-cron-token");
  if (token !== process.env["CRON_TOKEN"]) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
