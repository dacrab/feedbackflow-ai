import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackStatus } from "@/lib/types";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthParams } from "@/lib/utils/route-handler";

const StatusBody = z.object({
  status: z.enum(["New", "Acknowledged", "Actioned"]),
});

export const PATCH = withAuthParams(async (req, params, user) => {
  const json = await req.json();
  const parsed = StatusBody.safeParse(json);
  if (!parsed.success) return errorResponse("invalid status", 400);

  const admin = createAdminClient();
  const { error } = await admin
    .from("feedback_analyses")
    .update({ status: parsed.data.status as FeedbackStatus })
    .eq("feedback_item_id", params.id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return successResponse({ ok: true });
});
