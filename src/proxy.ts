import { NextRequest, NextResponse } from "next/server";

// Sliding window rate limiter — per IP, in-memory per edge instance
const store = new Map<string, { count: number; reset: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/sign-in":         { max: 10, windowMs: 60_000 },
  "/api/auth/sign-up":         { max: 5,  windowMs: 60_000 },
  "/api/auth/forget-password": { max: 5,  windowMs: 60_000 },
};

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const limit = LIMITS[pathname];

  if (limit && req.method === "POST") {
    const key = `${pathname}:${getIp(req)}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.reset) {
      store.set(key, { count: 1, reset: now + limit.windowMs });
    } else {
      entry.count++;
      if (entry.count > limit.max) {
        return NextResponse.json(
          { error: "too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((entry.reset - now) / 1000)),
              "X-RateLimit-Limit": String(limit.max),
              "X-RateLimit-Remaining": "0",
            },
          },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/sign-in", "/api/auth/sign-up", "/api/auth/forget-password"],
};
