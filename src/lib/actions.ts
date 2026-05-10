"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const repoSchema = z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "invalid repo format (owner/repo)");
const providerSchema = z.enum(["google", "openai", "anthropic"]);
const modelSchema = z.string().min(1).max(100);
const apiKeySchema = z.string().min(8).max(512);
const webhookSchema = z.string().url().startsWith("https://");
const statusSchema = z.enum(["New", "Acknowledged", "Actioned"]);

export async function addSource(repo: string, token?: string) {
  repoSchema.parse(repo);
  if (token) z.string().min(1).max(512).parse(token);
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
  z.string().uuid().parse(id);
  if (data.repo) repoSchema.parse(data.repo);
  if (data.token) z.string().min(1).max(512).parse(data.token);
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
  z.string().uuid().parse(id);
  const userId = await uid();
  await db.delete(userSources).where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function addNotification(webhook: string) {
  webhookSchema.parse(webhook);
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
  z.string().uuid().parse(id);
  if (data.webhook) webhookSchema.parse(data.webhook);
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
  z.string().uuid().parse(id);
  const userId = await uid();
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function saveSettings(provider: LLMProvider, model: string, apiKey: string) {
  providerSchema.parse(provider);
  modelSchema.parse(model);
  apiKeySchema.parse(apiKey);
  const userId = await uid();
  const apiKeyCipher = encrypt(apiKey);
  await db
    .insert(userSettings)
    .values({ userId, provider, model, apiKeyCipher })
    .onConflictDoUpdate({ target: userSettings.userId, set: { provider, model, apiKeyCipher } });
  revalidatePath("/settings");
}

export async function updateSettingsModel(model: string) {
  modelSchema.parse(model);
  const userId = await uid();
  await db.update(userSettings).set({ model }).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function updateSettingsKey(apiKey: string) {
  apiKeySchema.parse(apiKey);
  const userId = await uid();
  const apiKeyCipher = encrypt(apiKey);
  await db.update(userSettings).set({ apiKeyCipher }).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function deleteSettings() {
  const userId = await uid();
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function updateFeedbackStatus(feedbackItemId: string, status: FeedbackStatus) {
  z.string().uuid().parse(feedbackItemId);
  statusSchema.parse(status);
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
