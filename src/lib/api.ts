import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { timingSafeEqual } from "@/lib/crypto";
import { rateLimitAsync } from "@/lib/rate-limit";

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

export async function rateLimitMiddleware(
  req: Request,
  prefix: string,
  maxRequests = 10,
): Promise<Response | undefined> {
  const ip = clientIp(req);
  const { success } = await rateLimitAsync(`${prefix}:${ip}`, {
    maxRequests,
    windowMs: 60_000,
  });
  if (!success)
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  return undefined;
}

function clientIp(req: Request): string {
  // Vercel sets x-vercel-forwarded-for with the chain; last trustworthy hop is the
  // rightmost. We also accept x-forwarded-for for non-Vercel runtimes.
  const chain =
    req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for") ?? "";
  if (!chain) return "unknown";
  const hops = chain
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  // Rightmost is the closest to our infra; the client is the leftmost.
  // On Vercel, the rightmost hop is the one Vercel added and is trustworthy.
  return hops[hops.length - 1] ?? hops[0] ?? "unknown";
}
