import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.redirect("/api/auth/signout?callbackUrl=/login");
}
