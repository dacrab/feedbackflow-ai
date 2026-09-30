import type { Metadata } from "next";
import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import { Muted, PageHeader } from "@/components/ui/ui";
import { getServerSession, requireAuth } from "@/lib/api";
import { getSettingsData } from "@/lib/services/settings-service";

export const metadata: Metadata = { title: "settings" };

export default async function SettingsPage() {
  const userId = await requireAuth();
  // getServerSession is cache()-wrapped, so this is a memo hit.
  const user = (await getServerSession())?.user;
  const data = await getSettingsData(userId);

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
          enabledSources={data.sources.filter((s) => s.enabled).length}
          totalSources={data.sources.length}
          enabledHooks={data.hooks.filter((h) => h.enabled).length}
          lastRun={data.lastRun}
        />
        <DataSourcesCard sources={data.sources} />
        <NotificationsCard hooks={data.hooks} />
      </div>
    </div>
  );
}
