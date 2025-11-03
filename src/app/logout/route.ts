import { redirect } from "next/navigation";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST() {
  const supa = await createRouteHandlerClient();
  await supa.auth.signOut();
  redirect("/login");
}
