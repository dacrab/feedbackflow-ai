import { createAdminClient } from "@/lib/supabase/admin";
import { errorResponse, requireAuth, successResponse } from "@/lib/utils/api";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { status } = await req.json();
    if (!["New", "Acknowledged", "Actioned"].includes(status)) {
      return errorResponse("invalid status", 400);
    }
    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { error } = await admin
      .from("feedback_analyses")
      .update({ status })
      .eq("feedback_item_id", id)
      .eq("user_id", user.id);
    if (error) return errorResponse(error.message, 500);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}
