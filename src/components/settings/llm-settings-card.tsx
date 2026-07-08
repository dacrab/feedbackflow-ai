"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Select } from "@/components/ui/ui";
import { deleteSettings, saveSettings, updateSettingsModel } from "@/lib/actions";
import { isLLMProvider, type LLMProvider } from "@/lib/types";
import { handleActionError } from "@/lib/utils";

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: "openrouter", label: "OpenRouter (free)" },
  { value: "google", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const MODEL_OPTIONS: Record<LLMProvider, string[]> = {
  openrouter: [
    "openrouter/auto",
    "google/gemini-3.5-flash",
    "google/gemini-3.1-flash-lite",
    "google/gemini-2.5-flash",
    "openai/gpt-5.4-mini",
    "openai/gpt-5.4-nano",
    "anthropic/claude-haiku-4-5",
    "meta-llama/llama-4-maverick",
    "deepseek/deepseek-chat-v3-0324:free",
    "mistralai/mistral-small-3.2-24b-instruct:free",
  ],
  google: [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
  ],
  openai: ["gpt-5.4-nano", "gpt-5.4-mini", "gpt-5.4", "gpt-5.5"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-8"],
};

const KEY_LINKS: Record<LLMProvider, string> = {
  openrouter: "https://openrouter.ai/keys",
  google: "https://aistudio.google.com/app/apikey",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
};

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
    initialModel ?? MODEL_OPTIONS["openrouter"][0] ?? "openrouter/auto",
  );
  const [apiKey, setApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(!configured);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (!configured || editingKey) {
      if (!apiKey) return;
      startTransition(async () => {
        try {
          await saveSettings(provider, model, apiKey);
          toast.success("saved");
          setApiKey("");
          setEditingKey(false);
        } catch (e) {
          toast.error(handleActionError(e, "Failed to save settings"));
        }
      });
    } else {
      startTransition(async () => {
        try {
          await updateSettingsModel(model);
          toast.success("model updated");
        } catch (e) {
          toast.error(handleActionError(e, "Failed to update model"));
        }
      });
    }
  }

  function handleProviderChange(p: string) {
    if (!isLLMProvider(p)) return;
    setProvider(p);
    setModel(MODEL_OPTIONS[p][0] ?? "openrouter/auto");
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
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
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
            {MODEL_OPTIONS[provider].map((m) => (
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
                href={KEY_LINKS[provider]}
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
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteSettings();
                    toast.success("removed");
                    setEditingKey(true);
                    setApiKey("");
                  } catch (e) {
                    toast.error(handleActionError(e, "Failed to remove settings"));
                  }
                })
              }
              className="h-8 px-3 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              remove
            </button>
          )}
        </div>
      </div>

      {configured && (
        <div className="flex items-center gap-2 rounded border border-border bg-muted/20 px-3 py-2">
          <span className="text-xs text-green-500">●</span>
          <span className="text-xs text-muted-foreground">
            {initialProvider} · {initialModel}
          </span>
        </div>
      )}
    </Card>
  );
}
