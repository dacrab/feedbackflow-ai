import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const BASE = process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000";

async function handle() {
  await auth.api.signOut({ headers: await headers() });
  return NextResponse.redirect(new URL("/login", BASE));
}

export { handle as GET, handle as POST };
