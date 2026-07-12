import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { ONE_MINUTE_MS } from "@/lib/constants";
import { timingSafeEqual } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

interface Session {
  user: SessionUser;
}

export const getServerSession = cache(async (): Promise<Session | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return { user: { id: userId, email: row?.email ?? "", name: row?.name ?? "" } };
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
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return undefined;
}

export function rateLimitMiddleware(
  req: Request,
  prefix: string,
  maxRequests = 10,
): Response | undefined {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimit(`${prefix}:${ip}`, { maxRequests, windowMs: ONE_MINUTE_MS });
  if (!success)
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  return undefined;
}
