"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <label className="space-y-1.5">
            <span className="text-xs text-muted-foreground">provider</span>
            <select
              className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
              value={provider}
              onChange={(e) => setProvider(e.target.value as LLMProvider)}
            >
              <option value="google">google (gemini)</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
            </select>
          </label>
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">model</div>
            <Input
              variant="sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o, gemini-2.5-pro"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">
            api key {hasKey && <span className="text-green-500 ml-1">● connected</span>}
          </div>
          <Input
            variant="sm"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "••••••••" : "sk-..."}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isLoading}
          loadingText="saving..."
        >
          save
        </Button>
      </form>
    </div>
  );
}
