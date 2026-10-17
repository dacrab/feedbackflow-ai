import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let _db: ReturnType<typeof drizzle> | undefined;

// Lazy, so `next build` (no DATABASE_URL) does not throw at import time.
function getDb() {
  if (!_db) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _db = drizzle(neon(url));
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    // Pass the real db as the receiver so methods are bound to it rather than
    // to the proxy, even if drizzle ever starts using private fields.
    const real = getDb();
    return Reflect.get(real, prop, real);
  },
});
