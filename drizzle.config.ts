import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env and .env.local for tooling/CLI
config({ path: ".env" });
config({ path: ".env.local" });

const dbUrl = process.env["DATABASE_URL"];

if (!dbUrl) {
  throw new Error("DATABASE_URL is required for Drizzle configuration");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
