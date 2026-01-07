import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import type { FeedbackStatus } from "@/lib/types";
import { errorResponse, successResponse, withAuthParams } from "@/lib/utils";
import { FeedbackStatusSchema, parseOrError } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const parsed = parseOrError(FeedbackStatusSchema, await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
  }

  await db
    .update(feedbackAnalyses)
    .set({ status: parsed.data.status as FeedbackStatus })
    .where(
      and(eq(feedbackAnalyses.feedbackItemId, params.id), eq(feedbackAnalyses.userId, user.id)),
    );

  return successResponse({ ok: true });
});
