"use client";

import { Activity, Settings } from "lucide-react";
import { useMemo } from "react";
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

  const enabledSources = useMemo(() => (sources ?? []).filter((s) => s.enabled).length, [sources]);
  const enabledHooks = useMemo(() => (hooks ?? []).filter((h) => h.enabled).length, [hooks]);

  if (settingsLoading || sourcesLoading || hooksLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="info-box text-sm text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 animate-spin" />
          Loading workspace settings…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-2 border-b border-border/40 pb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="h-3.5 w-3.5" />
          </div>
          Settings
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Workspace Configuration
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Manage your LLM providers, data sources, and notification channels.
        </p>
      </header>

      <div className="grid gap-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
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
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <DataSourcesCard sources={sources ?? []} onRefetch={refetchSources} />
          <NotificationsCard hooks={hooks ?? []} onRefetch={refetchHooks} />
        </div>
      </div>
    </div>
  );
}
