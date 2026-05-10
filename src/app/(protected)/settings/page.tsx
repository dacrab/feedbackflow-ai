import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import { db } from "@/db/client";
import { userNotifications, userSettings, userSources } from "@/db/schema";
import { getServerSession } from "@/lib/api";
import { isLLMProvider } from "@/lib/types";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [settingsRow, sources, hooks] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">// configuration</p>
        <h1 className="text-xl font-medium">settings</h1>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <LLMSettingsCard
            initialProvider={
              settingsRow?.provider && isLLMProvider(settingsRow.provider)
                ? settingsRow.provider
                : null
            }
            initialModel={settingsRow?.model ?? null}
          />
          <SystemHealthCard
            enabledSources={sources.filter((s) => s.enabled).length}
            totalSources={sources.length}
            enabledHooks={hooks.filter((h) => h.enabled).length}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DataSourcesCard sources={sources} />
          <NotificationsCard hooks={hooks} />
        </div>
      </div>
    </div>
  );
}
