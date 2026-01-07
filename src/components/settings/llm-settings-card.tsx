"use client";

import { Key } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckIcon } from "@/components/ui/oauth-icons";
import { useApiMutation } from "@/hooks";
import type { LLMProvider } from "@/lib/types";

interface LLMSettingsCardProps {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
  initialHasKey: boolean;
}

export function LLMSettingsCard({
  initialProvider,
  initialModel,
  initialHasKey,
}: LLMSettingsCardProps) {
  const providerId = useId();
  const modelId = useId();
  const apiKeyId = useId();

  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? "google");
  const [model, setModel] = useState(initialModel ?? "");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [msg, setMsg] = useState<string | null>(null);

  const { mutate: saveSettings, isLoading } = useApiMutation({
    successMessage: "Settings saved",
    onSuccess: () => {
      setMsg("Saved. Key stored securely.");
      setHasKey(true);
      setApiKey("");
    },
  });

  useEffect(() => {
    if (initialProvider) setProvider(initialProvider);
    if (initialModel) setModel(initialModel);
    setHasKey(initialHasKey);
  }, [initialProvider, initialModel, initialHasKey]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await saveSettings("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, apiKey }),
    });
  }

  return (
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
            <Button type="submit" variant="default" className="px-6" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
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
  );
}
