import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  await auth.api.signOut({ headers: await headers() });
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function GET(req: Request) {
  return POST(req);
}
