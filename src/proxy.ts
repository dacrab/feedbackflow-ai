import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/inbox(.*)",
  "/feedback(.*)",
  "/settings(.*)",
  "/sync(.*)",
]);

// Strict nonce-based CSP, generated per request. With `strict: true` Clerk
// emits `script-src ... 'strict-dynamic' 'nonce-...'`, signs the nonce into a
// `content-security-policy` REQUEST header, and propagates both to the
// response — which is how Next.js picks the nonce up and stamps every script
// tag it renders (the documented middleware nonce pattern). Directives below
// are merged additively onto Clerk's defaults.
//
// Deliberate deviations from a hand-rolled policy:
// - script-src keeps NO http:/https: wildcard fallback: under 'strict-dynamic'
//   modern browsers ignore host/scheme sources anyway, and non-supporting
//   legacy browsers fall back to 'unsafe-inline', which Clerk keeps listed.
//   That is tighter than a blanket `https:` fallback while remaining safe.
// - Clerk's defaults allow-list js.stripe.com / maps.googleapis.com hosts we
//   do not use. They are inert under 'strict-dynamic' and cannot be removed
//   via the additive directives API.
export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  {
    contentSecurityPolicy: {
      strict: true,
      directives: {
        // React style props and third-party inline styles require it;
        // Tailwind classes themselves compile into a stylesheet.
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": [
          "'self'",
          "https:", // Sentry ingest beacons + LLM/webhook egress are server-side; browser needs Sentry only
        ],
        "img-src": ["'self'", "data:", "https:"], // data: for Sentry Replay screenshots
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
