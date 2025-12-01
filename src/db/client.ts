import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";

let Db: NeonHttpDatabase | null = null;

function getDb(): NeonHttpDatabase {
  if (Db) {
    return Db;
  }

  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is required for database client");
  }

  const sql = neon(url);
  Db = drizzle(sql);
  return Db;
}

export const db = new Proxy({} as NeonHttpDatabase, {
  get(_target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase];
  },
});
