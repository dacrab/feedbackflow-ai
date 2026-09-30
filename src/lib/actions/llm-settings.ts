"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { type LLMProvider, LLMProviderSchema } from "@/lib/types";
import { parse, requireUser, secretSchema } from "./guard";

const modelSchema = z.string().min(1).max(100);
const apiKeySchema = secretSchema.min(8);

export async function saveSettings(providerRaw: LLMProvider, modelRaw: string, apiKeyRaw: string) {
  const userId = await requireUser();
  const provider = parse(LLMProviderSchema, providerRaw);
  const model = parse(modelSchema, modelRaw);
  const apiKeyCipher = encrypt(parse(apiKeySchema, apiKeyRaw));
  await db
    .insert(userSettings)
    .values({ userId, provider, model, apiKeyCipher })
    .onConflictDoUpdate({ target: userSettings.userId, set: { provider, model, apiKeyCipher } });
  revalidatePath("/settings");
}

export async function updateSettingsModel(modelRaw: string) {
  const userId = await requireUser();
  const model = parse(modelSchema, modelRaw);
  await db.update(userSettings).set({ model }).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}

export async function deleteSettings() {
  const userId = await requireUser();
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  revalidatePath("/settings");
}
