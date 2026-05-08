import "server-only";

import { NextResponse } from "next/server";
import { timingSafeEqual } from "@/lib/crypto";
import { getServerSession } from "@/lib/session";

type AuthUser = { id: string; email: string | null };

export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession();
  if (!session?.user?.id) throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return { id: session.user.id, email: session.user.email ?? null };
}

export function isValidCronRequest(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];
  if (
    cronSecret &&
    authHeader?.startsWith("Bearer ") &&
    timingSafeEqual(authHeader.slice(7), cronSecret)
  ) {
    return true;
  }
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  return !!(cronToken && token && timingSafeEqual(token, cronToken));
}
