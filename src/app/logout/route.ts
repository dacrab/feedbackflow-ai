import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handle() {
  // Clerk manages sessions via its own middleware/cookies —
  // redirecting to the sign-in page is sufficient to end the session.
  return NextResponse.redirect(new URL("/login", APP_URL));
}

export { handle as GET, handle as POST };
