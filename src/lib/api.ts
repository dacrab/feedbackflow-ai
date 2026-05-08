import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { timingSafeEqual } from "@/lib/crypto";
import { getServerSession } from "@/lib/session";

type AuthUser = { id: string; email: string | null };

export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    throw NextResponse.json(
      { error: result.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  return result.data;
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession();
  if (!session?.user?.id) throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return { id: session.user.id, email: session.user.email ?? null };
}

export function withAuth(
  handler: (
    req: Request,
    ctx: { params?: Promise<{ [key: string]: string }> },
    user: AuthUser,
  ) => Promise<Response>,
) {
  return async (
    req: Request,
    ctx?: { params: Promise<{ [key: string]: string }> },
  ): Promise<Response> => {
    try {
      const user = await requireAuth();
      const handlerCtx = ctx ?? {};
      return await handler(req, handlerCtx, user);
    } catch (e) {
      return e instanceof Response ? e : NextResponse.json({ error: String(e) }, { status: 500 });
    }
  };
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
