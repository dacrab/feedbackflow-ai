import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import type { GitHubSourceConfig, SlackNotificationConfig } from "@/db/schema";
import { ingestRuns, userNotifications, userSettings, userSources } from "@/db/schema";
import { type IngestRunSummary, isLLMProvider, type LLMProvider } from "@/lib/types";

export interface SettingsData {
  settings: {
    provider: LLMProvider | null;
    model: string | null;
    hasKey: boolean;
  } | null;
  sources: Array<{
    id: string;
    type: "github";
    config: GitHubSourceConfig;
    enabled: boolean;
    lastChecked: Date | null;
    createdAt: Date;
  }>;
  hooks: Array<{
    id: string;
    type: "slack";
    config: SlackNotificationConfig;
    enabled: boolean;
  }>;
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
          provider:
            settingsRow.provider && isLLMProvider(settingsRow.provider)
              ? settingsRow.provider
              : null,
          model: settingsRow.model,
          hasKey: !!settingsRow.apiKeyCipher,
        }
      : null,
    sources,
    hooks,
    lastRun,
  };
}
