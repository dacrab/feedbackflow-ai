import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: ["@neondatabase/serverless"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content-Security-Policy is set per-request with a nonce in src/proxy.ts.
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env["SENTRY_ORG"] ?? "",
  project: process.env["SENTRY_PROJECT"] ?? "",
  authToken: process.env["SENTRY_AUTH_TOKEN"] ?? "",
  silent: !process.env["CI"],
  widenClientFileUpload: true,
  // Treeshaking is configured under `webpack`, which is the only shape
  // SentryBuildWebpackOptions accepts in v10. It has no effect while Next
  // bundles with Turbopack, so it is a no-op today and kept only so switching
  // back to webpack needs no config change.
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
  // Creates the Sentry cron monitor for the daily ingest; this repo has a
  // schedule in vercel.json and was getting no alerting for it.
  _experimental: { vercelCronsMonitoring: true },
});
