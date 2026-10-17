import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Server-side init is the same for both runtimes; only the browser bundle
  // needs its own config, which Next loads from instrumentation-client.ts.
  if (process.env["NEXT_RUNTIME"] === "nodejs" || process.env["NEXT_RUNTIME"] === "edge") {
    await import("../sentry.server.config");
  }
}

// Next calls this for every error thrown out of a route handler or Server
// Component. Without it those errors never become Sentry events.
export const onRequestError = Sentry.captureRequestError;
