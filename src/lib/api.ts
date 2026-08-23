import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { timingSafeEqual } from "@/lib/crypto";
import { type RateLimitConfig, rateLimit } from "@/lib/rate-limit";

export const getServerSession = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) {
    throw new Error("account is being provisioned — please try again in a moment");
  }
  return { user: { id: userId, email: row.email, name: row.name } };
});

export async function requireAuth(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("unauthorized");
  return session.user.id;
}

function isValidCronRequest(req: Request): boolean {
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.headers.get("authorization");
  if (
    cronSecret &&
    authHeader?.startsWith("Bearer ") &&
    timingSafeEqual(authHeader.slice("Bearer ".length), cronSecret)
  ) {
    return true;
  }
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  return !!(cronToken && token && timingSafeEqual(token, cronToken));
}

export function requireCron(req: Request): Response | undefined {
  if (isValidCronRequest(req)) return undefined;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function rateLimitMiddleware(
  req: Request,
  prefix: string,
  config: RateLimitConfig,
): Promise<Response | undefined> {
  const ip = clientIp(req);
  const ok = await rateLimit(`${prefix}:${ip}`, config);
  if (!ok)
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": String(config.windowMs / 1000) } },
    );
  return undefined;
}

function clientIp(req: Request): string {
  // Platform-set headers are trusted. In x-forwarded-for the leftmost values
  // come from the client and are trivially spoofable; only the rightmost entry
  // is appended by the trusted proxy, so fall back to that.
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const lastForwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return lastForwarded || "unknown";
}
