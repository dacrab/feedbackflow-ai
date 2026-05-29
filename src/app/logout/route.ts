import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

async function handle() {
  await auth.api.signOut({ headers: await headers() });
  return NextResponse.redirect(
    new URL("/login", process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000"),
  );
}

export { handle as GET, handle as POST };
