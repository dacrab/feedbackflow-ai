import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import { validateBody, withAuth } from "@/lib/api";
import { FeedbackStatusSchema } from "@/lib/validations";

export const PATCH = withAuth(async (req, ctx, user) => {
  const data = await validateBody(req, FeedbackStatusSchema);

  const params = await ctx.params;
  if (!params) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }
  const id = params["id"];
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  await db
    .update(feedbackAnalyses)
    .set({ status: data.status })
    .where(and(eq(feedbackAnalyses.feedbackItemId, id), eq(feedbackAnalyses.userId, user.id)));

  return NextResponse.json({ ok: true });
});
