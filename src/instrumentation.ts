export async function register() {
  // Server-side init is the same for both runtimes; only the browser bundle
  // needs its own config (sentry.client.config.ts, which the SDK loads itself).
  if (process.env["NEXT_RUNTIME"] === "nodejs" || process.env["NEXT_RUNTIME"] === "edge") {
    await import("../sentry.server.config");
  }
}
