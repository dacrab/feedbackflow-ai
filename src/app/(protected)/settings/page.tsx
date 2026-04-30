"use client";

import { DataSourcesCard } from "@/components/settings/data-sources-card";
import { LLMSettingsCard } from "@/components/settings/llm-settings-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { SystemHealthCard } from "@/components/settings/system-health-card";
import { useApiQuery } from "@/hooks";
import type { LLMProvider, TransformedNotificationRow, TransformedSourceRow } from "@/lib/types";

export default function SettingsPage() {
  const { data: settingsData, isLoading: settingsLoading } = useApiQuery<{
    provider: LLMProvider | null;
    model: string | null;
    hasKey: boolean;
  }>("/api/settings");

  const {
    data: sources,
    isLoading: sourcesLoading,
    refetch: refetchSources,
  } = useApiQuery<Array<TransformedSourceRow>>("/api/sources");

  const {
    data: hooks,
    isLoading: hooksLoading,
    refetch: refetchHooks,
  } = useApiQuery<Array<TransformedNotificationRow>>("/api/notifications");

  if (settingsLoading || sourcesLoading || hooksLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        loading...
      </div>
    );
  }

  const enabledSources = (sources ?? []).filter((s) => s.enabled).length;
  const enabledHooks = (hooks ?? []).filter((h) => h.enabled).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-muted-foreground">// configuration</p>
        <h1 className="text-xl font-medium">settings</h1>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <LLMSettingsCard
            initialProvider={settingsData?.provider ?? null}
            initialModel={settingsData?.model ?? null}
            initialHasKey={settingsData?.hasKey ?? false}
          />
          <SystemHealthCard
            enabledSources={enabledSources}
            totalSources={(sources ?? []).length}
            enabledHooks={enabledHooks}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DataSourcesCard sources={sources ?? []} onRefetch={refetchSources} />
          <NotificationsCard hooks={hooks ?? []} onRefetch={refetchHooks} />
        </div>
      </div>
    </div>
  );
}
