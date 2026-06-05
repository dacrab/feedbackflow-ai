import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { auth } from "@/auth";
import { timingSafeEqual } from "@/lib/crypto";

export const getServerSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireAuth(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.id) throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return session.user.id;
}

export function isValidCronRequest(req: Request): boolean {
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.headers.get("authorization");
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

export async function requireCronOrAuth(req: Request): Promise<Response | undefined> {
  if (isValidCronRequest(req)) return;
  try {
    await requireAuth();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return;
}
