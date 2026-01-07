import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

let _db: NeonHttpDatabase | null = null;

function getDb(): NeonHttpDatabase {
  if (!_db) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _db = drizzle(neon(url));
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase];
  },
});
