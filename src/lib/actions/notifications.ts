"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { userNotifications } from "@/db/schema";
import { MAX_SEVERITY } from "@/lib/constants";
import { encrypt } from "@/lib/crypto";
import { uuidSchema } from "@/lib/types";
import { isPrivateHost, parse, requireUser } from "./guard";

const webhookSchema = z
  .url("must be a valid URL")
  .startsWith("https://", "must start with https://")
  .refine(
    (raw) => !isPrivateHost(new URL(raw).hostname),
    "must be a public https URL (private and link-local addresses are rejected)",
  );

const patchSchema = z
  .object({
    enabled: z.boolean().optional(),
    minSeverity: z.number().int().min(1).max(MAX_SEVERITY).optional(),
  })
  // An empty patch would reach drizzle's set(), which throws "No values to
  // set" — a 500 for what is a no-op.
  .refine((patch) => Object.keys(patch).length > 0, "no fields to update");

export async function addNotification(webhook: string) {
  const userId = await requireUser();
  const url = parse(webhookSchema, webhook);
  await db
    .insert(userNotifications)
    .values({ userId, type: "slack", config: {}, secretCipher: encrypt(url) });
  revalidatePath("/settings");
}

export async function updateNotification(
  id: string,
  data: { enabled?: boolean; minSeverity?: number },
) {
  const userId = await requireUser();
  const hookId = parse(uuidSchema, id);
  const patch = parse(patchSchema, data);
  const setData: Partial<typeof userNotifications.$inferInsert> = {};
  if (patch.enabled !== undefined) setData.enabled = patch.enabled;
  if (patch.minSeverity !== undefined) setData.config = { minSeverity: patch.minSeverity };
  await db
    .update(userNotifications)
    .set(setData)
    .where(and(eq(userNotifications.id, hookId), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteNotification(id: string) {
  const userId = await requireUser();
  const hookId = parse(uuidSchema, id);
  await db
    .delete(userNotifications)
    .where(and(eq(userNotifications.id, hookId), eq(userNotifications.userId, userId)));
  revalidatePath("/settings");
}
