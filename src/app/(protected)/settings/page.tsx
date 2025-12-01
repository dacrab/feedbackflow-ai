"use client";

import { Activity, Bell, Database, Key, Settings } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import SettingsItem, {
  getNotificationLabel,
  getSourceDescription,
  getSourceLabel,
} from "@/components/settings/settings-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckIcon } from "@/components/ui/oauth-icons";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import type { LLMProvider, TransformedNotificationRow, TransformedSourceRow } from "@/lib/types";

export default function SettingsPage() {
  const providerId = useId();
  const modelId = useId();
  const apiKeyId = useId();
  const [provider, setProvider] = useState<LLMProvider>("google");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");
  const [slackUrl, setSlackUrl] = useState("");

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

  const { mutate: createSource, isLoading: creatingSource } = useApiMutation({
    successMessage: "Source added",
    errorMessage: "Failed to add source",
    onSuccess: () => {
      setRepo("");
      setGhToken("");
      refetchSources();
    },
  });

  const { mutate: createNotification, isLoading: creatingNotification } = useApiMutation({
    successMessage: "Webhook added",
    errorMessage: "Failed to add webhook",
    onSuccess: () => {
      setSlackUrl("");
      refetchHooks();
    },
  });

  const { mutate: saveSettings, isLoading: savingSettings } = useApiMutation({
    successMessage: "Settings saved",
    onSuccess: () => {
      setMsg("Saved. Key stored securely.");
      setHasKey(true);
      setApiKey("");
    },
  });

  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    stage: string;
    message: string;
    current?: number;
    total?: number;
  } | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncProgress({ stage: "starting", message: "Starting sync..." });

    try {
      const response = await fetch("/api/sync");
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            setSyncProgress(data);
            if (data.stage === "complete") {
              toast.success(data.message);
            } else if (data.stage === "error") {
              toast.error(data.message);
            }
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (settingsData && !hasKey && settingsData.provider) {
      setProvider(settingsData.provider);
      setModel(settingsData.model || "");
      setHasKey(Boolean(settingsData.hasKey));
    }
  }, [settingsData, hasKey]);

  const enabledSources = useMemo(() => (sources ?? []).filter((s) => s.enabled).length, [sources]);
  const enabledHooks = useMemo(() => (hooks ?? []).filter((h) => h.enabled).length, [hooks]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await saveSettings("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, apiKey }),
    });
  }

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
          <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                LLM Provider & API Key
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the model powering sentiment, topic classification, severity scoring, and
                summaries.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSave} className="space-y-6" aria-live="polite">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <label
                      className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                      htmlFor={providerId}
                    >
                      Provider
                    </label>
                    <div className="relative">
                      <select
                        id={providerId}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as LLMProvider)}
                      >
                        <option value="google">Google (Gemini)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <label
                      className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                      htmlFor={modelId}
                    >
                      Model
                    </label>
                    <Input
                      id={modelId}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. gpt-4o, gemini-2.5-pro"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <label
                    className="text-xs font-semibold uppercase text-muted-foreground tracking-wider"
                    htmlFor={apiKeyId}
                  >
                    API Key{" "}
                    {hasKey && (
                      <span className="text-emerald-500 text-[10px] ml-2 font-normal bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Connected
                      </span>
                    )}
                  </label>
                  <Input
                    id={apiKeyId}
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={hasKey ? "••••••••••••••••" : "sk-..."}
                    className="h-10 font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stored securely; only the final 4 characters display elsewhere.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="default"
                    className="px-6"
                    disabled={savingSettings}
                  >
                    {savingSettings ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
                {msg && (
                  <div className="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md flex items-center gap-2">
                    <CheckIcon className="w-3.5 h-3.5" /> {msg}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-muted/10 backdrop-blur-sm shadow-none h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="bg-background rounded-lg border border-border/50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                  Active Sources
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{enabledSources}</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    / {(sources ?? []).length} configured
                  </p>
                </div>
              </div>
              <div className="bg-background rounded-lg border border-border/50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                  Active Webhooks
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{enabledHooks}</p>
                  <p className="text-xs text-muted-foreground mb-1">monitoring alerts</p>
                </div>
              </div>
              <p className="text-xs bg-primary/5 text-primary p-3 rounded border border-primary/10">
                <span className="font-semibold">Tip:</span> Keep at least one source enabled to
                ensure continuous feedback ingestion.
              </p>
              <Button
                variant="outline"
                className="w-full"
                disabled={syncing || enabledSources === 0}
                onClick={() => runSync()}
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              {syncProgress && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    {syncProgress.message}
                  </p>
                  {syncProgress.total && syncProgress.current !== undefined && (
                    <div className="space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {syncProgress.current} / {syncProgress.total}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Data Sources
              </CardTitle>
              <p className="text-sm text-muted-foreground">Connect GitHub repositories or feeds.</p>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await createSource(
                    "/api/sources",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "github", repo, token: ghToken || undefined }),
                    },
                    () => {
                      setRepo("");
                      setGhToken("");
                      return null;
                    },
                  );
                }}
                className="space-y-3"
              >
                <div className="grid gap-3">
                  <Input
                    placeholder="GitHub repo (owner/name)"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="h-10"
                  />
                  <Input
                    placeholder="GitHub token (optional)"
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    type="password"
                    className="h-10"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={creatingSource}
                >
                  {creatingSource ? "Adding..." : "Connect Source"}
                </Button>
              </form>
              <div className="grid gap-3 text-sm border-t border-border/40 pt-4">
                {(sources || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
                    No data sources connected.
                  </div>
                )}
                {(sources || []).map((s) => (
                  <SettingsItem
                    key={s.id}
                    item={s}
                    apiPath="sources"
                    onUpdate={refetchSources}
                    label={getSourceLabel(s.type)}
                    description={getSourceDescription(s.config)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </CardTitle>
              <p className="text-sm text-muted-foreground">Alerts for high-severity feedback.</p>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await createNotification(
                    "/api/notifications",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "slack", webhook: slackUrl }),
                    },
                    () => {
                      setSlackUrl("");
                      return null;
                    },
                  );
                }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Slack webhook URL"
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={creatingNotification}
                >
                  {creatingNotification ? "Adding..." : "Add Webhook"}
                </Button>
              </form>
              <div className="grid gap-3 text-sm border-t border-border/40 pt-4">
                {(hooks || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
                    No notifications configured.
                  </div>
                )}
                {(hooks || []).map((h) => (
                  <SettingsItem
                    key={h.id}
                    item={h}
                    apiPath="notifications"
                    onUpdate={refetchHooks}
                    label={getNotificationLabel(h.type)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
