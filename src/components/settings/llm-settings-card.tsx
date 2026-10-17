"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ExternalLink,
  Input,
  Muted,
  maskedFieldClass,
  Panel,
  Select,
  StatusDot,
} from "@/components/ui/ui";
import { deleteSettings, saveSettings, updateSettingsModel } from "@/lib/actions";
import { LLM_PROVIDERS } from "@/lib/llm-providers";
import { isLLMProvider, type LLMProvider } from "@/lib/types";
import { useAction } from "@/lib/use-action";

const DEFAULT_PROVIDER = "openrouter";
const defaultModelFor = (provider: LLMProvider) =>
  LLM_PROVIDERS.find((p) => p.id === provider)?.defaultModel ?? "";

/** What the save button is for. `configured` is prop-derived and goes stale
 *  until revalidation, so the mode lives in state. */
type Mode = "unset" | "key" | "model";

export function LLMSettingsCard({
  initialProvider,
  initialModel,
  hasKey,
}: {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
  hasKey: boolean;
}) {
  const saved =
    initialProvider && initialModel ? { provider: initialProvider, model: initialModel } : null;
  const configured = saved !== null;
  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? DEFAULT_PROVIDER);
  const [model, setModel] = useState<string>(initialModel ?? defaultModelFor(DEFAULT_PROVIDER));
  const [apiKey, setApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(!configured);
  const { run, pending } = useAction();

  const providerMeta = LLM_PROVIDERS.find((p) => p.id === provider);
  const mode: Mode = !configured ? "unset" : editingKey ? "key" : "model";

  function save() {
    if (mode === "model") {
      run(() => updateSettingsModel(model), "model updated");
      return;
    }
    run(async () => {
      await saveSettings(provider, model, apiKey);
      setApiKey("");
      setEditingKey(false);
    }, "saved");
  }

  function changeProvider(next: string) {
    if (!isLLMProvider(next)) return;
    setProvider(next);
    setModel(defaultModelFor(next));
    if (configured) setEditingKey(true);
  }

  return (
    <Card title="llm provider">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5" htmlFor="llm-provider">
          <Muted>provider</Muted>
          <Select
            id="llm-provider"
            className="w-full"
            value={provider}
            onChange={(e) => changeProvider(e.target.value)}
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
            <label htmlFor="llm-api-key">
              <Muted>api key</Muted>
            </label>
            <div className="flex items-center gap-2">
              {configured && hasKey && !editingKey && <StatusDot tone="ok">● key saved</StatusDot>}
              {providerMeta && <ExternalLink href={providerMeta.keyUrl}>get key ↗</ExternalLink>}
            </div>
          </div>
          {mode === "model" ? (
            <button type="button" onClick={() => setEditingKey(true)} className={maskedFieldClass}>
              ••••••••••••••••
            </button>
          ) : (
            <div className="animate-slide-down">
              <Input
                id="llm-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`paste ${provider} api key...`}
                autoFocus={mode === "key"}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <Button
            variant="primary"
            isLoading={pending}
            loadingText="saving..."
            disabled={mode === "model" ? false : !apiKey}
            onClick={save}
          >
            {mode === "model" ? "update model" : "save"}
          </Button>
          {mode === "key" && (
            <Button
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
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await deleteSettings();
                  setApiKey("");
                  setEditingKey(true);
                }, "removed")
              }
            >
              remove
            </Button>
          )}
        </div>
      </div>

      {saved && (
        <Panel className="flex items-center gap-2">
          <StatusDot tone="ok">●</StatusDot>
          <Muted>
            {saved.provider} · {saved.model}
          </Muted>
        </Panel>
      )}
    </Card>
  );
}
