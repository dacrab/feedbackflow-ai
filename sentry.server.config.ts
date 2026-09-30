import * as Sentry from "@sentry/nextjs";

/** Covers both server runtimes: the options do not differ between node and
 *  edge, so there is one init call site rather than two files to keep in step.
 *  Imported by src/instrumentation.ts, which the SDK does not know the name of. */
Sentry.init({
  dsn: process.env["SENTRY_DSN"],
  environment: process.env["VERCEL_ENV"] || process.env["NODE_ENV"] || "development",
  tracesSampleRate: 0.1,
});
