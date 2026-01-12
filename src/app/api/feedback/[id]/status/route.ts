import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import { isErrorResponse, successResponse, validateBody, withAuthParams } from "@/lib/api";
import type { FeedbackStatus } from "@/lib/types";
import { FeedbackStatusSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const data = await validateBody(req, FeedbackStatusSchema);
  if (isErrorResponse(data)) return data;

  await db
    .update(feedbackAnalyses)
    .set({ status: data.status as FeedbackStatus })
    .where(
      and(eq(feedbackAnalyses.feedbackItemId, params.id), eq(feedbackAnalyses.userId, user.id)),
    );

  return successResponse({ ok: true });
});
