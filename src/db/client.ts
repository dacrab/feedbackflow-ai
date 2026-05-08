import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const url = process.env["DATABASE_URL"];
if (!url) throw new Error("DATABASE_URL required");

export const db = drizzle(neon(url));
