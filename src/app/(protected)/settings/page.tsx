"use client";

import { useEffect, useMemo, useState } from "react";
import NotificationItem from "@/components/settings/notification-item";
import SourceItem from "@/components/settings/source-item";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import type { LLMProvider, TransformedNotificationRow, TransformedSourceRow } from "@/lib/types";

export default function SettingsPage() {
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
  } = useApiQuery<TransformedSourceRow[]>("/api/sources");

  const {
    data: hooks,
    isLoading: hooksLoading,
    refetch: refetchHooks,
  } = useApiQuery<TransformedNotificationRow[]>("/api/notifications");

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

  // Initialize state from fetched data
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
        <div className="rounded-2xl border border-border/60 bg-background/85 px-6 py-3 text-sm text-muted-foreground">
          Loading workspace settings…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
          Control centre
        </span>
        <h1 className="text-3xl font-semibold leading-tight text-foreground">Workspace settings</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Configure analysis providers, ingest sources, and outbound notifications. Keep connections
          healthy to ensure every customer signal is classified and routed instantly.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="border border-border/60 bg-background/85">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              LLM provider & API key
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose the model powering sentiment, topic classification, severity scoring, and
              summaries.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-6" aria-live="polite">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <label
                    className="text-xs font-semibold uppercase text-muted-foreground"
                    htmlFor="provider"
                  >
                    Provider
                  </label>
                  <select
                    id="provider"
                    className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm text-foreground"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as LLMProvider)}
                  >
                    <option value="google">Google (Gemini)</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>
                <div className="space-y-2 text-sm">
                  <label
                    className="text-xs font-semibold uppercase text-muted-foreground"
                    htmlFor="model"
                  >
                    Model
                  </label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. gpt-4o, gemini-2.5-pro"
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <label
                  className="text-xs font-semibold uppercase text-muted-foreground"
                  htmlFor="apiKey"
                >
                  API key{" "}
                  {hasKey && <em className="lowercase text-muted-foreground">(already saved)</em>}
                </label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  Stored securely; only the final 4 characters display elsewhere.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button type="submit" variant="primary" className="px-6" disabled={savingSettings}>
                  {savingSettings ? "Saving…" : "Save provider"}
                </Button>
              </div>
              {msg && <div className="text-sm text-emerald-600">{msg}</div>}
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Connection health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Active sources
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{enabledSources}</p>
              <p className="text-xs text-muted-foreground">
                {(sources ?? []).length} configured total.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Notification webhooks
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{enabledHooks}</p>
              <p className="text-xs text-muted-foreground">
                Alerts fire for severity ≥ 4 when enabled.
              </p>
            </div>
            <p>
              Keep at least one data source and one webhook enabled to ensure high-severity feedback
              is routed in real time.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/60 bg-background/85">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Data sources</CardTitle>
          <p className="text-xs text-muted-foreground">
            Connect GitHub repositories or other public feeds. Daily ingest processes new items
            since the last run.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createSource(
                "/api/sources",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "github", repo, token: ghToken }),
                },
                () => {
                  setRepo("");
                  setGhToken("");
                  return null;
                },
              );
            }}
            className="grid gap-3 md:grid-cols-[2fr,2fr,auto]"
          >
            <Input
              placeholder="GitHub repo (owner/name)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
            <Input
              placeholder="GitHub token (optional)"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
            />
            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={creatingSource}>
                {creatingSource ? "Adding…" : "Add source"}
              </Button>
            </div>
          </form>
          <div className="grid gap-3 text-sm">
            {(sources || []).length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-background/70 px-5 py-4 text-muted-foreground">
                No data sources yet. Connect a GitHub repo (issues) or add a custom feed via
                automation.
              </div>
            )}
            {(sources || []).map((s) => (
              <SourceItem key={s.id} source={s} onUpdate={refetchSources} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-background/85">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Notifications</CardTitle>
          <p className="text-xs text-muted-foreground">
            Trigger Slack or webhook alerts when severity breaches your threshold.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
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
            className="grid gap-3 md:grid-cols-[2fr,auto]"
          >
            <Input
              placeholder="Slack webhook URL"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
            />
            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={creatingNotification}>
                {creatingNotification ? "Adding…" : "Add webhook"}
              </Button>
            </div>
          </form>
          <div className="grid gap-3 text-sm">
            {(hooks || []).length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-background/70 px-5 py-4 text-muted-foreground">
                No notifications configured yet. Add a Slack webhook to alert the team when severity
                spikes.
              </div>
            )}
            {(hooks || []).map((h) => (
              <NotificationItem key={h.id} notification={h} onUpdate={refetchHooks} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-border/60 bg-background/80 px-5 py-4 text-xs text-muted-foreground">
        <p>
          For Supabase local dev, magic link emails appear in Inbucket at{" "}
          <span className="font-medium">http://localhost:54324/</span>. For Supabase Cloud,
          configure SMTP in Authentication → Email and add{" "}
          <span className="font-medium">http://localhost:3000/auth/callback</span> to Allowed
          Redirect URLs.
        </p>
      </div>
    </div>
  );
}
