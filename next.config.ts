import type { NextConfig } from "next";

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
