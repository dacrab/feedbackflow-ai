"use client";

import { useEffect, useId, useState } from "react";
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

  const { mutate: saveSettings, isLoading } = useApiMutation({
    successMessage: "saved",
    onSuccess: () => {
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
    await saveSettings("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, apiKey }),
    });
  }

  return (
    <div className="rounded border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-3">// llm provider</p>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={providerId} className="text-xs text-muted-foreground">
              provider
            </label>
            <select
              id={providerId}
              className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
              value={provider}
              onChange={(e) => setProvider(e.target.value as LLMProvider)}
            >
              <option value="google">google (gemini)</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={modelId} className="text-xs text-muted-foreground">
              model
            </label>
            <input
              id={modelId}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o, gemini-2.5-pro"
              className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={apiKeyId} className="text-xs text-muted-foreground">
            api key{" "}
            {hasKey && <span className="text-green-500 ml-1">● connected</span>}
          </label>
          <input
            id={apiKeyId}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "••••••••" : "sk-..."}
            className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-8 px-4 rounded bg-foreground text-background text-sm hover:bg-foreground/90 disabled:opacity-50"
        >
          {isLoading ? "saving..." : "save"}
        </button>
      </form>
    </div>
  );
}
