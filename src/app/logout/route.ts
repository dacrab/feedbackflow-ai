import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handle() {
  return NextResponse.redirect(new URL("/login", APP_URL));
}

export { handle as GET, handle as POST };
