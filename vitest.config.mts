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
    coverage: {
      provider: "v8",
      reporter: ["text-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/db/seed.ts", "src/proxy.ts"],
      // Tenant isolation and outbound-request safety have no fallback: a
      // refactor that drops a user_id predicate is silent. Gate on them.
      thresholds: {
        "src/lib/actions/**": { lines: 80, functions: 80, branches: 75, statements: 80 },
        "src/lib/api.ts": { lines: 80, functions: 80, branches: 75, statements: 80 },
        "src/lib/crypto.ts": { lines: 90 },
      },
    },
  },
});
