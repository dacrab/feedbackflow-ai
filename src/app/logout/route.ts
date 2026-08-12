import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handle() {
  const { sessionId } = await auth();
  if (sessionId) {
    await (await clerkClient()).sessions.revokeSession(sessionId);
  }
  return NextResponse.redirect(
    new URL("/login", process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
  );
}

export { handle as POST };
