import { defineConfig } from "drizzle-kit";

const dbUrl = process.env["DATABASE_URL"];
if (!dbUrl) throw new Error("DATABASE_URL is required for Drizzle configuration");

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/views.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: dbUrl },
});
