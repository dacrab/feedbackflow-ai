"use client";

import { useState } from "react";
import { Button, Card, Input, Muted, Panel, Select } from "@/components/ui/ui";
import { deleteSettings, saveSettings, updateSettingsModel } from "@/lib/actions";
import { LLM_PROVIDERS } from "@/lib/llm-providers";
import { isLLMProvider, type LLMProvider } from "@/lib/types";
import { useAction } from "@/lib/use-action";

function useLLMSettingsActions({
  configured,
  provider,
  model,
  apiKey,
  editingKey,
  setProvider,
  setModel,
  setApiKey,
  setEditingKey,
  run,
}: {
  configured: boolean;
  provider: LLMProvider;
  model: string;
  apiKey: string;
  editingKey: boolean;
  setProvider: (p: LLMProvider) => void;
  setModel: (m: string) => void;
  setApiKey: (k: string) => void;
  setEditingKey: (e: boolean) => void;
  run: (fn: () => Promise<unknown>, msg?: string) => Promise<boolean>;
}) {
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

  function handleCancelEdit() {
    setEditingKey(false);
    setApiKey("");
  }

  function handleDelete() {
    run(async () => {
      await deleteSettings();
      setEditingKey(true);
      setApiKey("");
    }, "removed");
  }

  return { handleSave, handleProviderChange, handleCancelEdit, handleDelete };
}

function ApiKeySection({
  configured,
  hasKey,
  editingKey,
  provider,
  providerKeyUrl,
  apiKey,
  onApiKeyChange,
  onEditClick,
}: {
  configured: boolean;
  hasKey: boolean;
  editingKey: boolean;
  provider: LLMProvider;
  providerKeyUrl: string | undefined;
  apiKey: string;
  onApiKeyChange: (k: string) => void;
  onEditClick: () => void;
}) {
  return (
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center justify-between">
        <Muted>api key</Muted>
        <div className="flex items-center gap-2">
          {configured && hasKey && !editingKey && (
            <span className="text-xs text-green-500">● key saved</span>
          )}
          <a
            href={providerKeyUrl ?? "#"}
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
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={`paste ${provider} api key...`}
            autoFocus={editingKey && configured}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditClick}
          className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-left text-sm text-muted-foreground hover:border-foreground transition-colors"
        >
          ••••••••••••••••
        </button>
      )}
    </div>
  );
}

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

  const { handleSave, handleProviderChange, handleCancelEdit, handleDelete } =
    useLLMSettingsActions({
      configured,
      provider,
      model,
      apiKey,
      editingKey,
      setProvider,
      setModel,
      setApiKey,
      setEditingKey,
      run,
    });

  return (
    <Card title="llm provider" className={className ?? ""}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5" htmlFor="llm-provider">
          <Muted>provider</Muted>
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
          <Muted>model</Muted>
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
        <ApiKeySection
          configured={configured}
          hasKey={hasKey}
          editingKey={editingKey}
          provider={provider}
          providerKeyUrl={providerMeta?.keyUrl}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onEditClick={() => setEditingKey(true)}
        />

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
            <Button size="sm" onClick={handleCancelEdit}>
              cancel
            </Button>
          )}
          {configured && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={handleDelete}>
              remove
            </Button>
          )}
        </div>
      </div>

      {configured && (
        <Panel className="flex items-center gap-2">
          <span className="text-xs text-green-500">●</span>
          <Muted>
            {initialProvider} · {initialModel}
          </Muted>
        </Panel>
      )}
    </Card>
  );
}
