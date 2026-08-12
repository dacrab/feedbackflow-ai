import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import { Muted, PageHeader } from "@/components/ui/ui";
import { getServerSession } from "@/lib/api";
import { getSettingsData } from "@/lib/services/settings-service";

export default async function SettingsPage() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  const user = session?.user;
  if (!userId) return null;

  const data = await getSettingsData(userId);
  const enabledSources = data.sources.filter((s) => s.enabled);
  const enabledHooks = data.hooks.filter((h) => h.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader eyebrow="configuration" title="settings" />
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium">{user.name ?? user.email}</p>
            {user.name && <Muted>{user.email}</Muted>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        <div className="xl:col-span-2">
          <LLMSettingsCard
            initialProvider={data.settings?.provider ?? null}
            initialModel={data.settings?.model ?? null}
            hasKey={data.settings?.hasKey ?? false}
          />
        </div>
        <SystemHealthCard
          enabledSources={enabledSources.length}
          totalSources={data.sources.length}
          enabledHooks={enabledHooks.length}
          lastRun={data.lastRun}
        />
        <DataSourcesCard sources={data.sources} />
        <NotificationsCard hooks={data.hooks} />
      </div>
    </div>
  );
}
