"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input";

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
    (async () => {
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
    })();
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Configure your LLM provider and model.</p>
      </div>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-sm text-muted">LLM provider & model</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-6" aria-live="polite">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="block text-sm">
                <label className="text-xs text-muted" htmlFor="provider">
                  Provider
                </label>
                <select
                  id="provider"
                  className="mt-1 w-full rounded-md border border-border bg-input text-foreground px-3 py-2"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                >
                  <option value="google">Google (Gemini)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div className="block text-sm">
                <label className="text-xs text-muted" htmlFor="model">
                  Model
                </label>
                <Input
                  id="model"
                  className="mt-1"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model (e.g., gpt-4o, gemini-2.5-pro)"
                />
              </div>
            </div>
            <div className="block text-sm">
              <label className="text-xs text-muted" htmlFor="apiKey">
                API Key {hasKey && <em className="text-muted">(already saved)</em>}
              </label>
              <Input
                id="apiKey"
                className="mt-1"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="mt-1 text-xs text-muted">
                Stored securely; only last 4 characters may be displayed elsewhere.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
            {msg && <div className="text-sm">{msg}</div>}
          </form>
        </CardContent>
      </Card>
      {/* Data Sources */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-sm text-muted">Data sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            className="space-y-3"
          >
            <div className="grid md:grid-cols-2 gap-3">
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
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary">
                Add source
              </Button>
            </div>
          </form>
          <div className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span>
                    {s.type}: {s?.config?.repo} {s.enabled ? "(enabled)" : "(disabled)"}
                  </span>
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
                      <Button size="sm" variant="outline" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-sm text-muted">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            className="space-y-3"
          >
            <Input
              placeholder="Slack webhook URL"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" variant="secondary">
                Add webhook
              </Button>
            </div>
          </form>
          <div className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              {hooks.map((h) => (
                <li key={h.id} className="flex items-center justify-between">
                  <span>
                    {h.type}: Slack {h.enabled ? "(enabled)" : "(disabled)"}
                  </span>
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
                      <Button size="sm" variant="outline" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted">
        Note: For Supabase local dev, magic link emails appear in Inbucket at
        http://localhost:54324/. For Supabase Cloud, configure SMTP in Authentication → Email and
        add http://localhost:3000/auth/callback to Allowed Redirect URLs for dev.
      </p>
    </div>
  );
}
