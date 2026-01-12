import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.localhost", "*.127.0.0.1"],
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: process.env["NODE_ENV"] === "production",
  },
};

export default nextConfig;
