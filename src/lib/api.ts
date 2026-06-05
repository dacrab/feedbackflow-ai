import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { auth } from "@/auth";
import { timingSafeEqual } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const getServerSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireAuth(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.id) throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return session.user.id;
}

function isValidCronRequest(req: Request): boolean {
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

export function rateLimitMiddleware(
  req: Request,
  prefix: string,
  maxRequests = 10,
): Response | undefined {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`${prefix}:${ip}`, { maxRequests, windowMs: 60_000 });
  if (!success)
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  return;
}
