"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications, userSettings, userSources } from "@/db/schema";
import { getServerSession } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import type { FeedbackStatus, LLMProvider } from "@/lib/types";

async function uid() {
  const s = await getServerSession();
  if (!s?.user?.id) throw new Error("unauthorized");
  return s.user.id;
}

export async function addSource(repo: string, token?: string) {
  const userId = await uid();
  await db.insert(userSources).values({
    userId,
    type: "github",
    config: { repo },
    secretCipher: token ? encrypt(token) : null,
  });
  runIngest().catch(console.error);
  revalidatePath("/settings");
}

export async function updateSource(
  id: string,
  data: { enabled?: boolean; repo?: string; token?: string },
) {
  const userId = await uid();
  await db
    .update(userSources)
    .set({
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.repo !== undefined && { config: { repo: data.repo } }),
      ...(data.token !== undefined && { secretCipher: data.token ? encrypt(data.token) : null }),
    })
    .where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteSource(id: string) {
  const userId = await uid();
  await db.delete(userSources).where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function addNotification(webhook: string) {
  const userId = await uid();
  await db
    .insert(userNotifications)
    .values({ userId, type: "slack", config: {}, secretCipher: encrypt(webhook) });
  revalidatePath("/settings");
}

export async function updateNotification(
  id: string,
  data: { enabled?: boolean; webhook?: string },
) {
  const userId = await uid();
  await db
    .update(userNotifications)
    .set({
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.webhook !== undefined && {
        secretCipher: data.webhook ? encrypt(data.webhook) : null,
      }),
    })
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteNotification(id: string) {
  const userId = await uid();
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function saveSettings(provider: LLMProvider, model: string, apiKey: string) {
  const userId = await uid();
  const apiKeyCipher = encrypt(apiKey);
  await db
    .insert(userSettings)
    .values({ userId, provider, model, apiKeyCipher })
    .onConflictDoUpdate({ target: userSettings.userId, set: { provider, model, apiKeyCipher } });
  revalidatePath("/settings");
}

export async function updateFeedbackStatus(feedbackItemId: string, status: FeedbackStatus) {
  const userId = await uid();
  await db
    .update(feedbackAnalyses)
    .set({ status })
    .where(
      and(eq(feedbackAnalyses.feedbackItemId, feedbackItemId), eq(feedbackAnalyses.userId, userId)),
    );
  revalidatePath("/inbox");
  revalidatePath(`/feedback/${feedbackItemId}`);
}
