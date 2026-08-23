"use server";

import * as Sentry from "@sentry/nextjs";
import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { feedbackAnalyses, userNotifications, userSettings, userSources } from "@/db/schema";
import { requireAuth } from "@/lib/api";
import { ADD_SOURCE_INGEST_LIMIT, RATE_LIMITS } from "@/lib/constants";
import { encrypt } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { runIngest } from "@/lib/services/ingest-service";
import {
  type FeedbackStatus,
  FeedbackStatusSchema,
  type LLMProvider,
  LLMProviderSchema,
} from "@/lib/types";

async function uid() {
  const userId = await requireAuth();
  if (!(await rateLimit(`actions:${userId}`, RATE_LIMITS.action)))
    throw new Error("Too many requests. Please try again later.");
  return userId;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "invalid input");
  return result.data;
}

const uuidSchema = z.string().uuid();
const repoSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "invalid repo format (owner/repo)");
const modelSchema = z.string().min(1).max(100);
const apiKeySchema = z.string().min(8).max(512);
const webhookSchema = z
  .string()
  .url("must be a valid URL")
  .startsWith("https://", "must start with https://");

export async function addSource(repo: string, token?: string) {
  parse(repoSchema, repo);
  if (token) parse(z.string().min(1).max(512), token);
  const userId = await uid();
  const [source] = await db
    .insert(userSources)
    .values({
      userId,
      type: "github",
      config: { repo },
      secretCipher: token ? encrypt(token) : null,
    })
    .returning({ id: userSources.id });
  if (!source) throw new Error("failed to add source");
  after(() => {
    // Ingest just the new source with a small analysis cap so the detached
    // callback finishes well within function limits; cron covers the rest.
    runIngest({ userId, sourceId: source.id, maxItems: ADD_SOURCE_INGEST_LIMIT }).catch((e) =>
      Sentry.captureException(e),
    );
  });
  revalidatePath("/settings");
}

export async function updateSource(id: string, data: { enabled?: boolean }) {
  parse(uuidSchema, id);
  if (typeof data.enabled !== "boolean") return;
  const userId = await uid();
  await db
    .update(userSources)
    .set({ enabled: data.enabled })
    .where(and(eq(userSources.id, id), eq(userSources.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteSource(id: string) {
  parse(uuidSchema, id);
  const userId = await uid();
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
  data: { enabled?: boolean; minSeverity?: number },
) {
  parse(uuidSchema, id);
  if (data.minSeverity !== undefined) parse(z.number().int().min(1).max(5), data.minSeverity);
  const userId = await uid();
  const setData: { enabled?: boolean; config?: SQL } = {};
  if (data.enabled !== undefined) setData.enabled = data.enabled;
  if (data.minSeverity !== undefined) {
    // Merge in SQL so concurrent updates can't clobber each other's keys.
    setData.config = sql`${userNotifications.config} || ${JSON.stringify({
      minSeverity: data.minSeverity,
    })}::jsonb`;
  }
  await db
    .update(userNotifications)
    .set(setData)
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

export async function saveSettings(provider: LLMProvider, model: string, apiKey: string) {
  parse(LLMProviderSchema, provider);
  parse(modelSchema, model);
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

export async function deleteSettings() {
  const userId = await uid();
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function updateFeedbackStatus(feedbackItemId: string, status: FeedbackStatus) {
  parse(uuidSchema, feedbackItemId);
  parse(FeedbackStatusSchema, status);
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
  const s = parse(FeedbackStatusSchema, status);
  const userId = await uid();
  await db
    .update(feedbackAnalyses)
    .set({ status: s })
    .where(and(eq(feedbackAnalyses.userId, userId), inArray(feedbackAnalyses.feedbackItemId, ids)));
  revalidatePath("/inbox");
  revalidatePath("/feedback/[id]", "page");
}
