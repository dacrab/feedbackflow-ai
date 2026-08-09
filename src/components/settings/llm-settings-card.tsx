"use client";

import { useState } from "react";
import { Button, Card, Input, Panel, Select } from "@/components/ui/ui";
import { deleteSettings, saveSettings, updateSettingsModel } from "@/lib/actions";
import { LLM_PROVIDERS } from "@/lib/llm-providers";
import { isLLMProvider, type LLMProvider } from "@/lib/types";
import { useAction } from "@/lib/use-action";

export function LLMSettingsCard({
  initialProvider,
  initialModel,
  hasKey,
  className,
}: {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
  hasKey: boolean;
  className?: string;
}) {
  const configured = !!(initialProvider && initialModel);
  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? "openrouter");
  const [model, setModel] = useState<string>(
    initialModel ?? LLM_PROVIDERS.find((p) => p.id === "openrouter")?.defaultModel ?? "",
  );
  const [apiKey, setApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(!configured);
  const { run, pending } = useAction();

  const providerMeta = LLM_PROVIDERS.find((p) => p.id === provider);

  function handleSave() {
    if (configured && !editingKey) {
      run(() => updateSettingsModel(model), "model updated");
    } else {
      if (!apiKey) return;
      run(async () => {
        await saveSettings(provider, model, apiKey);
        setApiKey("");
        setEditingKey(false);
      }, "saved");
    }
  }

  function handleProviderChange(p: string) {
    if (!isLLMProvider(p)) return;
    setProvider(p);
    setModel(LLM_PROVIDERS.find((x) => x.id === p)?.defaultModel ?? "");
    if (configured) setEditingKey(true);
  }

  return (
    <Card title="llm provider" className={className ?? ""}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5" htmlFor="llm-provider">
          <span className="text-xs text-muted-foreground">provider</span>
          <Select
            id="llm-provider"
            className="w-full"
            size="sm"
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {LLM_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1.5 sm:col-span-2" htmlFor="llm-model">
          <span className="text-xs text-muted-foreground">model</span>
          <Select
            id="llm-model"
            className="w-full"
            size="sm"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {providerMeta?.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">api key</span>
            <div className="flex items-center gap-2">
              {configured && hasKey && !editingKey && (
                <span className="text-xs text-green-500">● key saved</span>
              )}
              <a
                href={providerMeta?.keyUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                get key ↗
              </a>
            </div>
          </div>
          {editingKey || !configured ? (
            <div className="animate-slide-down">
              <Input
                variant="sm"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`paste ${provider} api key...`}
                autoFocus={editingKey && configured}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingKey(true)}
              className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-left text-sm text-muted-foreground hover:border-foreground transition-colors"
            >
              ••••••••••••••••
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <Button
            variant="primary"
            size="sm"
            isLoading={pending}
            loadingText="saving..."
            disabled={editingKey || !configured ? !apiKey : false}
            onClick={handleSave}
          >
            {configured && !editingKey ? "update model" : "save"}
          </Button>
          {editingKey && configured && (
            <Button
              size="sm"
              onClick={() => {
                setEditingKey(false);
                setApiKey("");
              }}
            >
              cancel
            </Button>
          )}
          {configured && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await deleteSettings();
                  setEditingKey(true);
                  setApiKey("");
                }, "removed")
              }
            >
              remove
            </Button>
          )}
        </div>
      </div>

      {configured && (
        <Panel className="flex items-center gap-2">
          <span className="text-xs text-green-500">●</span>
          <span className="text-xs text-muted-foreground">
            {initialProvider} · {initialModel}
          </span>
        </Panel>
      )}
    </Card>
  );
}
