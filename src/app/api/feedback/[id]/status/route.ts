import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supa = await createRouteHandlerClient();
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!["New", "Acknowledged", "Actioned"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("feedback_analyses")
    .update({ status })
    .eq("feedback_item_id", id)
    .eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
