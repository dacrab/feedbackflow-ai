import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(root, "src"),
      "server-only": resolve(root, "vitest.server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // A stray .only would silently skip the rest of the suite in CI.
    allowOnly: false,
    coverage: {
      provider: "v8",
      reporter: ["text-summary"],
      // Only the library is gated; the UI, pages, routes and schema are
      // presentational or declarative and are not worth brittle tests.
      include: ["src/lib/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
      // A regression in authz, crypto or the ingest pipeline is silent, so those
      // paths are kept covered. Not 100%: forcing every defensive branch into a
      // test buys nothing.
      thresholds: {
        "src/lib/**": { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});
