import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import type { FeedbackStatus } from "@/lib/types";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthParams } from "@/lib/utils/route-handler";

const StatusBody = z.object({
  status: z.enum(["New", "Acknowledged", "Actioned"]),
});

export const PATCH = withAuthParams(async (req, params, user) => {
  const json = await req.json();
  const parsed = StatusBody.safeParse(json);
  if (!parsed.success) {
    return errorResponse("invalid status", 400);
  }
  await db
    .update(feedbackAnalyses)
    .set({ status: parsed.data.status as FeedbackStatus })
    .where(
      and(eq(feedbackAnalyses.feedbackItemId, params.id), eq(feedbackAnalyses.userId, user.id)),
    );
  return successResponse({ ok: true });
});
