import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { PROVISIONING_MESSAGE } from "@/lib/constants";
import { timingSafeEqual } from "@/lib/crypto";
import { type RateLimitConfig, rateLimit } from "@/lib/rate-limit";

// Typed so handlers can tell an auth failure from a DB error.
export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, ...(headers && { headers }) });
}

export const getServerSession = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) throw new Error(PROVISIONING_MESSAGE);
  return { user: { id: userId, email: row.email, name: row.name } };
});

export async function requireAuth(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

/** Returns a 401 response when the caller is not the cron scheduler. Only the
 *  bearer scheme Vercel sends exists: a second header scheme would be a second
 *  secret to rotate and a second place to get the comparison wrong. */
export function requireCron(req: Request): Response | undefined {
  // Fails closed, so an authenticated user cannot trigger a platform-wide
  // ingest/digest, and a misconfigured deploy cannot silently run open.
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = req.headers.get("authorization");
  if (
    cronSecret &&
    authHeader?.startsWith("Bearer ") &&
    timingSafeEqual(authHeader.slice("Bearer ".length), cronSecret)
  ) {
    return undefined;
  }
  return jsonError("unauthorized", 401);
}

/** Keyed on a caller-chosen identity, not a request header: `x-forwarded-for`
 *  is trivially rotated, so trusting it would make the limit meaningless. */
export async function rateLimitResponse(
  identity: string,
  config: RateLimitConfig,
): Promise<Response | undefined> {
  if (await rateLimit(identity, config)) return undefined;
  return jsonError("too many requests", 429, {
    "Retry-After": String(Math.ceil(config.windowMs / 1000)),
  });
}
