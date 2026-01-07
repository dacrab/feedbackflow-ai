import { type ClassValue, clsx } from "clsx";
import { NextResponse } from "next/server";
import { twMerge } from "tailwind-merge";
import { auth } from "@/auth";
import { timingSafeEqual } from "@/lib/crypto";

// Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Auth
type AuthUser = { id: string; name: string | null; email: string | null; image: string | null };

async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  const user = session?.user as
    | { id?: string; name?: string | null; email?: string | null; image?: string | null }
    | undefined;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return user;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const extractErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// API responses
export const errorResponse = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });
export const successResponse = (data: unknown, status = 200) => NextResponse.json(data, { status });

// Route handlers
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

// Cron validation
export function isValidCronRequest(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];
  if (
    cronSecret &&
    authHeader?.startsWith("Bearer ") &&
    timingSafeEqual(authHeader.slice(7), cronSecret)
  )
    return true;
  const token = req.headers.get("x-cron-token");
  const cronToken = process.env["CRON_TOKEN"];
  return !!(cronToken && token && timingSafeEqual(token, cronToken));
}

// Date
export const formatDateUTC = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(iso).toISOString();
  }
};

export const getDateNHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600000).toISOString();

// Data transform
type RowWithSecret = {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  secret_cipher: string | null;
};
export const transformRowWithSecret = <T extends RowWithSecret>(row: T) => ({
  id: row.id,
  type: row.type,
  config: row.config,
  enabled: row.enabled,
  hasSecret: Boolean(row.secret_cipher),
});

// Slack
export async function notifySlackTo(url: string, text: string) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {}
}

export async function notifySlack(text: string) {
  const url = process.env["SLACK_WEBHOOK_URL"];
  if (url) await notifySlackTo(url, text);
}
