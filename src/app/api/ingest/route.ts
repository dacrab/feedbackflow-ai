import { NextResponse } from "next/server";
import { runIngest } from "@/lib/services/ingest-service";
import { requireAuth } from "@/lib/utils/api";

function isValidCronRequest(req: Request): boolean {
  // Check Vercel's cron secret (automatically set in production)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check custom cron token (for manual testing)
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  if (cronToken && token === cronToken) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  // Allow if valid cron request; otherwise require auth
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
