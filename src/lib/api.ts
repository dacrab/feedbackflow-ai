import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { timingSafeEqual } from "@/lib/crypto";
import { getServerSession } from "@/lib/session";

type AuthUser = { id: string; email: string | null };

/** Validate request body against schema, returns errorResponse on failure */
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T | Response> {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return errorResponse(result.error.issues[0]?.message || "Invalid input", 400);
  }
  return result.data;
}

/** Check if validation result is an error response */
export function isErrorResponse(result: unknown): result is Response {
  return result instanceof Response;
}

async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession();
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return user;
}

export const errorResponse = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });

export const successResponse = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function withAuthGet<T>(handler: (user: AuthUser) => Promise<T>) {
  return async (): Promise<T | Response> => {
    try {
      return await handler(await requireAuth());
    } catch (e) {
      return e instanceof Response ? e : errorResponse(String(e));
    }
  };
}

export function withAuthRequest<T>(handler: (req: Request, user: AuthUser) => Promise<T>) {
  return async (req: Request): Promise<T | Response> => {
    try {
      return await handler(req, await requireAuth());
    } catch (e) {
      return e instanceof Response ? e : errorResponse(String(e));
    }
  };
}

export function withAuthParams<T>(
  handler: (req: Request, params: { id: string }, user: AuthUser) => Promise<T>,
) {
  return async (req: Request, ctx: { params: Promise<{ id: string }> }): Promise<T | Response> => {
    try {
      const [user, params] = await Promise.all([requireAuth(), ctx.params]);
      return await handler(req, params, user);
    } catch (e) {
      return e instanceof Response ? e : errorResponse(String(e));
    }
  };
}

export function withAuthDelete<T>(handler: (params: { id: string }, user: AuthUser) => Promise<T>) {
  return async (_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<T | Response> => {
    try {
      const [user, params] = await Promise.all([requireAuth(), ctx.params]);
      return await handler(params, user);
    } catch (e) {
      return e instanceof Response ? e : errorResponse(String(e));
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
