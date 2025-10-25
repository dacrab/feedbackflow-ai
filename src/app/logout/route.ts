import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supa = await createRouteHandlerClient();
  await supa.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/login", url.origin));
}
