import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env["NEXT_PUBLIC_SENTRY_DSN"],
  environment: process.env["VERCEL_ENV"] || process.env["NODE_ENV"] || "development",
  tracesSampleRate: 0.1,
});

// Without this, client-side navigations produce no transactions, so errors
// thrown after a soft navigation are never captured.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
