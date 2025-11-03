"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Provider = "google" | "openai" | "anthropic";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<Provider>("google");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Sources
  type SourceRow = {
    id: string;
    type: string;
    config?: { repo?: string };
    enabled: boolean;
    hasSecret: boolean;
  };
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");
  // Notifications
  type HookRow = {
    id: string;
    type: string;
    enabled: boolean;
    hasSecret: boolean;
  };
  const [hooks, setHooks] = useState<HookRow[]>([]);
  const [slackUrl, setSlackUrl] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const [s1, s2, s3] = await Promise.all([
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/sources", { cache: "no-store" }),
        fetch("/api/notifications", { cache: "no-store" }),
      ]);
      if (s1.ok) {
        const data = await s1.json();
        if (data.provider) setProvider(data.provider);
        if (data.model) setModel(data.model);
        setHasKey(Boolean(data.hasKey));
      }
      if (s2.ok) setSources(await s2.json());
      if (s3.ok) setHooks(await s3.json());
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, apiKey }),
    });
    if (!res.ok) {
      const t = await res.text();
      toast.error("Save failed");
      setMsg(`Save failed: ${t}`);
    } else {
      toast.success("Settings saved");
      setMsg("Saved. Key stored securely.");
      setHasKey(true);
      setApiKey("");
    }
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Workspace settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage LLM providers, data sources, and outbound notifications for this FeedbackFlow workspace.
        </p>
      </div>
      <Card className="mx-auto w-full max-w-4xl border-border/60 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
        <CardHeader>
          <CardTitle className="text-xs">LLM provider & model</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure the model used for sentiment, topic classification, severity scoring, and summaries.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-6" aria-live="polite">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground" htmlFor="provider">
                  Provider
                </label>
                <select
                  id="provider"
                  className="w-full rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-3.5 py-2.5 text-sm text-foreground"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                >
                  <option value="google">Google (Gemini)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div className="space-y-2 text-sm">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground" htmlFor="model">
                  Model
                </label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model (e.g., gpt-4o, gemini-2.5-pro)"
                />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground" htmlFor="apiKey">
                API key {hasKey && <em className="lowercase text-muted-foreground">(already saved)</em>}
              </label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Stored securely; only last 4 characters may be displayed elsewhere.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" variant="primary" className="px-6">
                Save
              </Button>
            </div>
            {msg && <div className="text-sm text-emerald-600">{msg}</div>}
          </form>
        </CardContent>
      </Card>
      {/* Data Sources */}
      <Card className="mx-auto w-full max-w-4xl border-border/60">
        <CardHeader>
          <CardTitle className="text-xs">Data sources</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a public repository or review feed. Daily ingest will process new items since the last run.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await fetch("/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "github", repo, token: ghToken }),
              });
              if (r.ok) {
                toast.success("Source added");
                setRepo("");
                setGhToken("");
                const s = await fetch("/api/sources", { cache: "no-store" });
                if (s.ok) setSources(await s.json());
              } else toast.error("Failed to add source");
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
              <Button type="submit" variant="primary">
                Add source
              </Button>
            </div>
          </form>
          <div className="grid gap-3 text-sm">
            {sources.length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] px-5 py-4 text-muted-foreground">
                No data sources yet. Connect a GitHub repo (issues) or add another public feed via custom integration.
              </div>
            )}
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{s.type === "github" ? "GitHub Issues" : s.type}</p>
                  <p className="text-xs text-muted-foreground">{s?.config?.repo || "Custom configuration"}</p>
                  <span
                    className={cn(
                      "badge mt-2",
                      s.enabled
                        ? "bg-[rgba(34,197,94,0.16)] text-emerald-600 border-transparent"
                        : "bg-[rgba(148,163,184,0.14)] text-slate-600 border-transparent",
                    )}
                  >
                    {s.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch(`/api/sources/${s.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: !s.enabled }),
                      });
                      const res = await fetch("/api/sources", {
                        cache: "no-store",
                      });
                      if (res.ok) setSources(await res.json());
                    }}
                  >
                    <Button size="sm" variant="outline" type="submit">
                      {s.enabled ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch(`/api/sources/${s.id}`, {
                        method: "DELETE",
                      });
                      const res = await fetch("/api/sources", {
                        cache: "no-store",
                      });
                      if (res.ok) setSources(await res.json());
                    }}
                  >
                    <Button size="sm" variant="ghost" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mx-auto w-full max-w-4xl border-border/60 bg-[color-mix(in_oklab,var(--background)_95%,transparent)]">
        <CardHeader>
          <CardTitle className="text-xs">Notifications</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Trigger Slack or webhook alerts when severity scores breach your threshold.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "slack", webhook: slackUrl }),
              });
              if (r.ok) {
                toast.success("Webhook added");
                setSlackUrl("");
                const s = await fetch("/api/notifications", {
                  cache: "no-store",
                });
                if (s.ok) setHooks(await s.json());
              } else toast.error("Failed to add webhook");
            }}
            className="grid gap-3 md:grid-cols-[2fr,auto]"
          >
            <Input
              placeholder="Slack webhook URL"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
            />
            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary">
                Add webhook
              </Button>
            </div>
          </form>
          <div className="grid gap-3 text-sm">
            {hooks.length === 0 && (
              <div className="rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] px-5 py-4 text-muted-foreground">
                No notifications configured yet. Add a Slack webhook to alert the team on high severity feedback.
              </div>
            )}
            {hooks.map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{h.type === "slack" ? "Slack webhook" : h.type}</p>
                  <span
                    className={cn(
                      "badge mt-2",
                      h.enabled
                        ? "bg-[rgba(34,197,94,0.16)] text-emerald-600 border-transparent"
                        : "bg-[rgba(148,163,184,0.14)] text-slate-600 border-transparent",
                    )}
                  >
                    {h.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch(`/api/notifications/${h.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: !h.enabled }),
                      });
                      const res = await fetch("/api/notifications", {
                        cache: "no-store",
                      });
                      if (res.ok) setHooks(await res.json());
                    }}
                  >
                    <Button size="sm" variant="outline" type="submit">
                      {h.enabled ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch(`/api/notifications/${h.id}`, {
                        method: "DELETE",
                      });
                      const res = await fetch("/api/notifications", {
                        cache: "no-store",
                      });
                      if (res.ok) setHooks(await res.json());
                    }}
                  >
                    <Button size="sm" variant="ghost" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_93%,transparent)] px-5 py-4 text-xs text-muted-foreground">
        <p>
          For Supabase local dev, magic link emails appear in Inbucket at <span className="font-medium">http://localhost:54324/</span>. For Supabase Cloud, configure SMTP in Authentication → Email and add <span className="font-medium">http://localhost:3000/auth/callback</span> to Allowed Redirect URLs.
        </p>
      </div>
    </div>
  );
}
