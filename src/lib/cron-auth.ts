import { NextResponse } from "next/server";
import { timingSafeEqual } from "@/lib/crypto";

export function requireCron(req: Request): Response | undefined {
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.headers.get("authorization");
  if (
    cronSecret &&
    authHeader?.startsWith("Bearer ") &&
    timingSafeEqual(authHeader.slice(7), cronSecret)
  ) {
    return undefined;
  }
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  if (cronToken && token && timingSafeEqual(token, cronToken)) {
    return undefined;
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
