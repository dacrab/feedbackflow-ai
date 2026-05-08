import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { timingSafeEqual } from "@/lib/crypto";

export const getServerSession = cache(async () => auth.api.getSession({ headers: await headers() }));

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
