import { redirect } from "next/navigation";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next");
  const defaultNext = type === "recovery" ? "/reset-password" : "/dashboard";
  const next = nextParam || defaultNext;

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  }
  redirect(next);
}
