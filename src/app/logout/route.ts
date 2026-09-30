import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { LOGIN_PATH } from "@/lib/constants";

async function handle(req: Request) {
  const { sessionId } = await auth();
  if (sessionId) {
    await (await clerkClient()).sessions.revokeSession(sessionId);
  }
  // 303, not the default 307: 307 preserves the method, so the browser would
  // re-POST to /login and get a 405.
  return NextResponse.redirect(new URL(LOGIN_PATH, req.url), 303);
}

export { handle as POST };
