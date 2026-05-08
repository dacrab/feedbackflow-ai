"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import type { NewUserNotification, NewUserSource } from "@/db/schema";
import { feedbackAnalyses, userNotifications, userSettings, userSources } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { runIngest } from "@/lib/services/ingest-service";
import { getServerSession } from "@/lib/api";
import type { FeedbackStatus, LLMProvider } from "@/lib/types";

async function getUser() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("unauthorized");
  return session.user.id;
}

export async function addSource(repo: string, token?: string) {
  const userId = await getUser();
  await db.insert(userSources).values({
    userId,
    type: "github",
    config: { repo },
    secretCipher: token ? encrypt(token) : null,
  });
  runIngest().catch(console.error);
  revalidatePath("/settings");
}

export async function updateSource(id: string, data: { enabled?: boolean; repo?: string; token?: string }) {
  const userId = await getUser();
  const updates: Partial<NewUserSource> = {};
  if (typeof data.enabled === "boolean") updates.enabled = data.enabled;
  if (typeof data.repo === "string") updates.config = { repo: data.repo };
  if (typeof data.token === "string") updates.secretCipher = data.token ? encrypt(data.token) : null;
  await db.update(userSources).set(updates).where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteSource(id: string) {
  const userId = await getUser();
  await db.delete(userSources).where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function addNotification(webhook: string) {
  const userId = await getUser();
  await db.insert(userNotifications).values({
    userId,
    type: "slack",
    config: {},
    secretCipher: encrypt(webhook),
  });
  revalidatePath("/settings");
}

export async function updateNotification(id: string, data: { enabled?: boolean; webhook?: string }) {
  const userId = await getUser();
  const updates: Partial<NewUserNotification> = {};
  if (typeof data.enabled === "boolean") updates.enabled = data.enabled;
  if (typeof data.webhook === "string") updates.secretCipher = data.webhook ? encrypt(data.webhook) : null;
  await db.update(userNotifications).set(updates).where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteNotification(id: string) {
  const userId = await getUser();
  await db.delete(userNotifications).where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function saveSettings(provider: LLMProvider, model: string, apiKey: string) {
  const userId = await getUser();
  const apiKeyCipher = encrypt(apiKey);
  await db.insert(userSettings)
    .values({ userId, provider, model, apiKeyCipher })
    .onConflictDoUpdate({ target: userSettings.userId, set: { provider, model, apiKeyCipher } });
  revalidatePath("/settings");
}

export async function updateFeedbackStatus(feedbackItemId: string, status: FeedbackStatus) {
  const userId = await getUser();
  await db.update(feedbackAnalyses)
    .set({ status })
    .where(and(eq(feedbackAnalyses.feedbackItemId, feedbackItemId), eq(feedbackAnalyses.userId, userId)));
  revalidatePath("/inbox");
  revalidatePath(`/feedback/${feedbackItemId}`);
}
