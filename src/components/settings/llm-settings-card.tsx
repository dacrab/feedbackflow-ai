"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSettings } from "@/lib/actions";
import type { LLMProvider } from "@/lib/types";

export function LLMSettingsCard({ initialProvider, initialModel, initialHasKey }: {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
  initialHasKey: boolean;
}) {
  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? "google");
  const [model, setModel] = useState(initialModel ?? "");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [pending, startTransition] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveSettings(provider, model, apiKey);
        setHasKey(true);
        setApiKey("");
        toast.success("saved");
      } catch {
        toast.error("failed to save");
      }
    });
  }

  return (
    <div className="rounded border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-3">// llm provider</p>
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-muted-foreground">provider</span>
            <select className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground" value={provider} onChange={(e) => setProvider(e.target.value as LLMProvider)}>
              <option value="google">google (gemini)</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
            </select>
          </label>
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">model</div>
            <Input variant="sm" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-4o, gemini-2.5-pro" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">api key {hasKey && <span className="text-green-500 ml-1">● connected</span>}</div>
          <Input variant="sm" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={hasKey ? "••••••••" : "sk-..."} />
        </div>
        <Button type="submit" variant="primary" size="sm" isLoading={pending} loadingText="saving...">save</Button>
      </form>
    </div>
  );
}
