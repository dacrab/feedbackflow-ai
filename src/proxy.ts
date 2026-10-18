import { clerkMiddleware } from "@clerk/nextjs/server";
import { LOGIN_PATH, SIGNUP_PATH } from "@/lib/constants";

// Auth is enforced per resource, not by the middleware: the (protected) layout
// and every /api handler call requireAuth()/getServerSession(). Clerk deprecated
// createRouteMatcher because path matching can diverge from Next's routing and
// leave a resource reachable, so this middleware only mints the CSP nonce.
//
// `strict: true` makes Clerk mint a per-request nonce and add
// `script-src 'strict-dynamic' 'nonce-…'`, which is how Next stamps every
// script it renders. The directives below merge onto Clerk's own defaults.
export default clerkMiddleware(() => undefined, {
  // Where Clerk sends unauthenticated users; the (protected) layout redirects
  // here too.
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
});

export const config = {
  matcher: ["/((?!_next|_static|_vercel|favicon|icon).*)"],
};
