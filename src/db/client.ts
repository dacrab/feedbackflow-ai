import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

type Db = ReturnType<typeof drizzle>;

let _db: Db | null = null;

function getDb(): Db {
  if (!_db) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _db = drizzle(neon(url));
  }
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
