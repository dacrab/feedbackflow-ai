"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { feedbackAnalyses } from "@/db/schema";
import { FeedbackStatusSchema, uuidSchema } from "@/lib/types";
import { parse, requireUser } from "./guard";

const BULK_MAX = 200;

export async function updateFeedbackStatus(feedbackItemId: string, statusRaw: string) {
  const userId = await requireUser();
  const itemId = parse(uuidSchema, feedbackItemId);
  const status = parse(FeedbackStatusSchema, statusRaw);
  await db
    .update(feedbackAnalyses)
    .set({ status })
    .where(and(eq(feedbackAnalyses.feedbackItemId, itemId), eq(feedbackAnalyses.userId, userId)));
  revalidatePath("/inbox");
  revalidatePath(`/feedback/${itemId}`);
}

export async function bulkUpdateStatus(ids: string[], statusRaw: string) {
  const userId = await requireUser();
  const itemIds = parse(z.array(uuidSchema).min(1).max(BULK_MAX), ids);
  const status = parse(FeedbackStatusSchema, statusRaw);
  await db
    .update(feedbackAnalyses)
    .set({ status })
    .where(
      and(eq(feedbackAnalyses.userId, userId), inArray(feedbackAnalyses.feedbackItemId, itemIds)),
    );
  revalidatePath("/inbox");
  revalidatePath("/feedback/[id]", "page");
}
