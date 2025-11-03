import { z } from "zod";
import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { errorResponse, requireAuth, successResponse } from "@/lib/utils/api";

const PatchBody = z.object({
  enabled: z.boolean().optional(),
  webhook: z.string().optional(), // empty string clears
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    const json = await req.json();
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);
    const supa = await createRouteHandlerClient();
    const upd: Record<string, unknown> = {};
    if (typeof parsed.data.enabled === "boolean") upd["enabled"] = parsed.data.enabled;
    if (typeof parsed.data.webhook === "string")
      upd["secret_cipher"] = parsed.data.webhook ? encrypt(parsed.data.webhook) : null;
    const { error } = await supa.from("user_notifications").update(upd).eq("id", id).eq("user_id", user.id);
    if (error) return errorResponse(error.message, 500);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    const supa = await createRouteHandlerClient();
    const { error } = await supa.from("user_notifications").delete().eq("id", id).eq("user_id", user.id);
    if (error) return errorResponse(error.message, 500);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(String(error), 500);
  }
}
