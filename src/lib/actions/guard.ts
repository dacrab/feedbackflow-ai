import "server-only";

import { z } from "zod";
import { requireAuth } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

/** Authenticates and charges the rate limit, before any database work. */
export async function requireUser() {
  const userId = await requireAuth();
  if (!(await rateLimit(`actions:${userId}`, RATE_LIMITS.action))) {
    throw new Error("Too many requests. Please try again later.");
  }
  return userId;
}

/** Blocks loopback, RFC1918, unique-local and cloud-metadata targets, so a
 *  stored webhook URL can never be used to reach internal infrastructure.
 *  Exported for tests: a regression here is a silent SSRF hole. */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal"))
    return true;
  if (host === "::1" || host === "0.0.0.0") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(host)) return true; // unique local
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!v4) return false;
  const [a = 0, b = 0] = v4.slice(1).map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local
  return false;
}

/** Postgres unique_violation. Drizzle wraps driver failures in
 *  DrizzleQueryError, which puts the pg code on `cause`, so the whole chain
 *  has to be walked or the friendly message never appears. */
export function isUniqueViolation(err: unknown): boolean {
  for (
    let e: unknown = err, depth = 0;
    e && depth < 5;
    e = (e as { cause?: unknown }).cause, depth++
  ) {
    if (typeof e === "object" && "code" in e && (e as { code?: string }).code === "23505")
      return true;
  }
  return false;
}

/** Bounds the plaintext of any stored credential (LLM key, GitHub token);
 *  keys are encrypted before they reach the database, so the stored value is
 *  longer than what this allows in. */
const SECRET_MAX_LENGTH = 512;
export const secretSchema = z.string().max(SECRET_MAX_LENGTH);

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "invalid input");
  return result.data;
}
