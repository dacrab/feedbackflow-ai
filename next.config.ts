import type { NextConfig } from "next";

// Suppress noisy baseline-browser-mapping warning about outdated data
// biome-ignore lint/suspicious/noConsole: intentionally patching console to filter warnings
const originalWarn = console.warn;
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (typeof args[0] === "string" && args[0].includes("[baseline-browser-mapping]")) {
    return;
  }
  originalWarn.apply(console, args);
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow cross-origin dev access from localhost and 127.0.0.1 variants
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost", "*.127.0.0.1"],
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: process.env["NODE_ENV"] === "production",
  },
};

export default nextConfig;
