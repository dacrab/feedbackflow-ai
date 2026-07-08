import { desc, eq } from "drizzle-orm";
import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import { db } from "@/db/client";
import { ingestRuns, userNotifications, userSettings, userSources } from "@/db/schema";
import { getServerSession } from "@/lib/api";
import { isLLMProvider } from "@/lib/types";

export default async function SettingsPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  const user = session?.user;
  if (!userId) return null;

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

  const provider =
    settingsRow?.provider && isLLMProvider(settingsRow.provider) ? settingsRow.provider : null;

  const enabledSources = sources.filter((s) => s.enabled);
  const enabledHooks = hooks.filter((h) => h.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">// configuration</p>
          <h1 className="text-xl font-medium">settings</h1>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium">{user.name ?? user.email}</p>
            {user.name && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        <div className="xl:col-span-2">
          <LLMSettingsCard
            initialProvider={provider}
            initialModel={settingsRow?.model ?? null}
            hasKey={!!settingsRow?.apiKeyCipher}
          />
        </div>
        <SystemHealthCard
          enabledSources={enabledSources.length}
          totalSources={sources.length}
          enabledHooks={enabledHooks.length}
          lastRun={lastRun}
        />
        <DataSourcesCard sources={sources} />
        <NotificationsCard hooks={hooks} />
      </div>
    </div>
  );
}
