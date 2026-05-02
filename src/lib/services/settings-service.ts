import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import type { NotificationConfig, SourceConfig } from "@/db/schema";
import { userNotifications, userSettings, userSources } from "@/db/schema";
import { isLLMProvider, type LLMProvider } from "@/lib/types";

export async function getUserSettings(
  userId: string,
): Promise<{ provider: LLMProvider | null; model: string | null; hasKey: boolean }> {
  const [row] = await db
    .select({
      provider: userSettings.provider,
      model: userSettings.model,
      apiKeyCipher: userSettings.apiKeyCipher,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return {
    provider: row?.provider && isLLMProvider(row.provider) ? row.provider : null,
    model: row?.model ?? null,
    hasKey: Boolean(row?.apiKeyCipher),
  };
}

export async function getUserSources(
  userId: string,
): Promise<Array<{ id: string; type: string; config: SourceConfig; enabled: boolean }>> {
  return db
    .select({
      id: userSources.id,
      type: userSources.type,
      config: userSources.config,
      enabled: userSources.enabled,
    })
    .from(userSources)
    .where(eq(userSources.userId, userId))
    .orderBy(desc(userSources.createdAt));
}

export async function getUserNotifications(
  userId: string,
): Promise<Array<{ id: string; type: string; config: NotificationConfig; enabled: boolean }>> {
  return db
    .select({
      id: userNotifications.id,
      type: userNotifications.type,
      config: userNotifications.config,
      enabled: userNotifications.enabled,
    })
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt));
}
