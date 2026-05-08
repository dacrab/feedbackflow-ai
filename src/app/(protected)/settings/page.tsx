import { redirect } from "next/navigation";
import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import {
  getUserNotifications,
  getUserSettings,
  getUserSources,
} from "@/lib/services/settings-service";
import { getServerSession } from "@/lib/api";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const [settingsData, sources, hooks] = await Promise.all([
    getUserSettings(session.user.id),
    getUserSources(session.user.id),
    getUserNotifications(session.user.id),
  ]);

  const enabledSources = sources.filter((s) => s.enabled).length;
  const enabledHooks = hooks.filter((h) => h.enabled).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-muted-foreground">// configuration</p>
        <h1 className="text-xl font-medium">settings</h1>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <LLMSettingsCard
            initialProvider={settingsData.provider}
            initialModel={settingsData.model}
            initialHasKey={settingsData.hasKey}
          />
          <SystemHealthCard
            enabledSources={enabledSources}
            totalSources={sources.length}
            enabledHooks={enabledHooks}
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
