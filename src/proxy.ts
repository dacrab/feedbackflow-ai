import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { LOGIN_PATH, SIGNUP_PATH } from "@/lib/constants";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/inbox(.*)",
  "/feedback(.*)",
  "/settings(.*)",
  // /api/* handlers authenticate themselves. Never add /api/sync here:
  // auth.protect() 404s non-document requests, breaking the SSE stream.
]);

// `strict: true` makes Clerk mint a per-request nonce, sign it into a request
// header, and add `script-src 'strict-dynamic' 'nonce-…'` — which is how Next
// picks it up and stamps every script it renders. Directives below are merged
// onto Clerk's defaults, so its extra host allow-list stays (inert under
// 'strict-dynamic') and cannot be removed.
export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  {
    // Without these, auth.protect() bounces to Clerk's hosted portal.
    signInUrl: LOGIN_PATH,
    signUpUrl: SIGNUP_PATH,
    contentSecurityPolicy: {
      strict: true,
      directives: {
        // Recharts sets inline styles; 'strict-dynamic' does not cover style-src.
        "style-src": ["'self'", "'unsafe-inline'"],
        // Named hosts, not a blanket `https:`, which would let injected
        // script exfiltrate to anywhere. LLM/webhook calls are server-side.
        "connect-src": [
          "'self'",
          "https://*.ingest.sentry.io",
          "wss://*.ingest.sentry.io",
          "https://clerk-telemetry.com",
          "https://*.clerk-telemetry.com",
        ],
        "img-src": ["'self'", "data:", "https:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'self'"],
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next|_static|_vercel|favicon|icon).*)"],
};
