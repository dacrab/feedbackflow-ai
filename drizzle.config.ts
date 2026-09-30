import { defineConfig } from "drizzle-kit";

// No module-scope throw: knip loads this file on every run, and exiting 0 after
// a load error turns dead-code detection into a silent no-op. Commands that
// need a URL (`migrate`, `push`, `studio`) fail on their own.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env["DATABASE_URL"] ?? "" },
});
