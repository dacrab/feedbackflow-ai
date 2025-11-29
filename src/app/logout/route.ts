import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL("/api/auth/signout?callbackUrl=/login", req.url);
  return NextResponse.redirect(url);
}
