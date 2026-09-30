import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { ingestRuns, userNotifications, userSettings, userSources } from "@/db/schema";
import { type IngestRunSummary, isLLMProvider, type LLMProvider } from "@/lib/types";

export type SourceRow = Pick<
  typeof userSources.$inferSelect,
  "id" | "type" | "config" | "enabled" | "lastChecked" | "createdAt"
>;

export type HookRow = Pick<
  typeof userNotifications.$inferSelect,
  "id" | "type" | "config" | "enabled"
>;

export interface SettingsData {
  settings: {
    provider: LLMProvider | null;
    model: string | null;
    hasKey: boolean;
  } | null;
  sources: SourceRow[];
  hooks: HookRow[];
  lastRun: IngestRunSummary | null;
}

export async function getSettingsData(userId: string): Promise<SettingsData> {
  const [settingsRow, sources, hooks, lastRun] = await Promise.all([
    db
      .select({
        provider: userSettings.provider,
        model: userSettings.model,
        apiKeyCipher: userSettings.apiKeyCipher,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        id: userSources.id,
        type: userSources.type,
        config: userSources.config,
        enabled: userSources.enabled,
        lastChecked: userSources.lastChecked,
        createdAt: userSources.createdAt,
      })
      .from(userSources)
      .where(eq(userSources.userId, userId))
      .orderBy(desc(userSources.createdAt)),
    db
      .select({
        id: userNotifications.id,
        type: userNotifications.type,
        config: userNotifications.config,
        enabled: userNotifications.enabled,
      })
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt)),
    db
      .select({
        startedAt: ingestRuns.startedAt,
        finishedAt: ingestRuns.finishedAt,
        ok: ingestRuns.ok,
        error: ingestRuns.error,
        fetched: ingestRuns.fetched,
        inserted: ingestRuns.inserted,
        analyzed: ingestRuns.analyzed,
      })
      .from(ingestRuns)
      .where(eq(ingestRuns.userId, userId))
      .orderBy(desc(ingestRuns.startedAt))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  return {
    settings: settingsRow
      ? {
          provider: isLLMProvider(settingsRow.provider) ? settingsRow.provider : null,
          model: settingsRow.model,
          hasKey: !!settingsRow.apiKeyCipher,
        }
      : null,
    sources,
    hooks,
    lastRun,
  };
}
