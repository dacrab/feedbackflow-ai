import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handle() {
  return NextResponse.redirect(
    new URL("/login", process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
  );
}

export { handle as GET, handle as POST };
