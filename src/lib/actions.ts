"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications, userSettings, userSources } from "@/db/schema";
import { getServerSession } from "@/lib/api";
import { encrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";
import type { FeedbackStatus, LLMProvider } from "@/lib/types";

async function uid() {
  const s = await getServerSession();
  if (!s?.user?.id) throw new Error("unauthorized");
  return s.user.id;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "invalid input");
  return result.data;
}

async function authedUid() {
  const userId = await uid();
  const { success } = rateLimit(`actions:${userId}`, { maxRequests: 20, windowMs: 60_000 });
  if (!success) throw new Error("Too many requests. Please try again later.");
  return userId;
}

const uuidSchema = z.string().uuid();
const repoSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "invalid repo format (owner/repo)");
const providerSchema = z.enum(["google", "openai", "anthropic", "openrouter"]);
const modelSchema = z.string().min(1).max(100);
const apiKeySchema = z.string().min(8).max(512);
const webhookSchema = z
  .string()
  .url("must be a valid URL")
  .startsWith("https://", "must start with https://");
const statusSchema = z.enum(["New", "Acknowledged", "Actioned"]);

export async function addSource(repo: string, token?: string) {
  parse(repoSchema, repo);
  if (token) parse(z.string().min(1).max(512), token);
  const userId = await authedUid();
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
  parse(uuidSchema, id);
  if (data.repo) parse(repoSchema, data.repo);
  if (data.token) parse(z.string().min(1).max(512), data.token);
  const userId = await authedUid();
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
  parse(uuidSchema, id);
  const userId = await authedUid();
  await db.delete(userSources).where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function addNotification(webhook: string) {
  parse(webhookSchema, webhook);
  const userId = await uid();
  await db
    .insert(userNotifications)
    .values({ userId, type: "slack", config: {}, secretCipher: encrypt(webhook) });
  revalidatePath("/settings");
}

export async function updateNotification(
  id: string,
  data: { enabled?: boolean; webhook?: string; minSeverity?: number },
) {
  parse(uuidSchema, id);
  if (data.webhook) parse(webhookSchema, data.webhook);
  if (data.minSeverity !== undefined) parse(z.number().int().min(1).max(5), data.minSeverity);
  const userId = await uid();
  await db
    .update(userNotifications)
    .set({
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.webhook !== undefined && {
        secretCipher: data.webhook ? encrypt(data.webhook) : null,
      }),
      ...(data.minSeverity !== undefined && { config: { minSeverity: data.minSeverity } }),
    })
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteNotification(id: string) {
  parse(uuidSchema, id);
  const userId = await uid();
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function saveSettings(provider: LLMProvider, model: string, encryptedPayload: string) {
  parse(providerSchema, provider);
  parse(modelSchema, model);
  const apiKey = Buffer.from(encryptedPayload, "base64").toString("utf8");
  parse(apiKeySchema, apiKey);
  const userId = await uid();
  const apiKeyCipher = encrypt(apiKey);
  await db
    .insert(userSettings)
    .values({ userId, provider, model, apiKeyCipher })
    .onConflictDoUpdate({ target: userSettings.userId, set: { provider, model, apiKeyCipher } });
  revalidatePath("/settings");
}

export async function updateSettingsModel(model: string) {
  parse(modelSchema, model);
  const userId = await uid();
  await db.update(userSettings).set({ model }).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function updateSettingsKey(encryptedPayload: string) {
  const apiKey = Buffer.from(encryptedPayload, "base64").toString("utf8");
  parse(apiKeySchema, apiKey);
  const userId = await uid();
  await db
    .update(userSettings)
    .set({ apiKeyCipher: encrypt(apiKey) })
    .where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function deleteSettings() {
  const userId = await uid();
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function updateFeedbackStatus(feedbackItemId: string, status: FeedbackStatus) {
  parse(uuidSchema, feedbackItemId);
  parse(statusSchema, status);
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

export async function bulkUpdateStatus(ids: string[], status: string) {
  parse(z.array(uuidSchema).min(1).max(200), ids);
  parse(statusSchema, status);
  const userId = await uid();
  await db
    .update(feedbackAnalyses)
    .set({ status: status as FeedbackStatus })
    .where(and(eq(feedbackAnalyses.userId, userId), inArray(feedbackAnalyses.feedbackItemId, ids)));
  revalidatePath("/inbox");
}
