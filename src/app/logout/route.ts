import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

async function handle(req: Request) {
  await auth.api.signOut({ headers: await headers() });
  return NextResponse.redirect(new URL("/login", req.url));
}

export { handle as GET, handle as POST };
