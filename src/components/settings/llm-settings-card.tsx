"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Select } from "@/components/ui/ui";
import {
  deleteSettings,
  saveSettings,
  updateSettingsKey,
  updateSettingsModel,
} from "@/lib/actions";
import type { LLMProvider } from "@/lib/types";

const MODEL_OPTIONS: Record<LLMProvider, [string, ...string[]]> = {
  google: ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"],
  openai: ["gpt-5.4-nano", "gpt-5.4-mini", "gpt-5-mini", "gpt-4.1-mini", "gpt-4.1"],
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
};

type Mode = "view" | "add" | "edit-model" | "update-key";

export function LLMSettingsCard({
  initialProvider,
  initialModel,
}: {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialProvider && initialModel ? "view" : "add");
  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? "google");
  const [model, setModel] = useState(initialModel ?? MODEL_OPTIONS["google"][0]);
  const [apiKey, setApiKey] = useState("");
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<void>, onDone?: () => void) =>
    startTransition(async () => {
      try {
        await fn();
        onDone?.();
      } catch {
        toast.error("failed");
      }
    });

  function changeProvider(p: LLMProvider) {
    setProvider(p);
    setModel(MODEL_OPTIONS[p][0]);
  }

  if (mode === "view")
    return (
      <Card title="llm provider">
        <div className="rounded border border-border bg-muted/20 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{initialProvider}</span>
            <span className="text-xs text-green-500">● connected</span>
          </div>
          <p className="text-xs text-muted-foreground">{initialModel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              setProvider(initialProvider ?? "google");
              setModel(initialModel ?? MODEL_OPTIONS[initialProvider ?? "google"][0]);
              setMode("edit-model");
            }}
          >
            change model
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setApiKey("");
              setMode("update-key");
            }}
          >
            update key
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              act(deleteSettings, () => {
                setMode("add");
                setModel(MODEL_OPTIONS["google"][0]);
                setApiKey("");
              })
            }
            className="h-8 px-3 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            remove
          </button>
        </div>
      </Card>
    );

  if (mode === "edit-model")
    return (
      <Card title="llm provider">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">model</p>
          <Select
            size="sm"
            className="w-full"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODEL_OPTIONS[initialProvider ?? "google"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={pending}
            loadingText="saving..."
            onClick={() =>
              act(
                () => updateSettingsModel(model),
                () => {
                  toast.success("model updated");
                  setMode("view");
                },
              )
            }
          >
            save
          </Button>
          <Button size="sm" onClick={() => setMode("view")}>
            cancel
          </Button>
        </div>
      </Card>
    );

  if (mode === "update-key")
    return (
      <Card title="llm provider">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            new api key <span className="text-foreground">({initialProvider})</span>
          </p>
          <Input
            variant="sm"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="paste your api key..."
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={pending}
            loadingText="saving..."
            onClick={() =>
              act(
                () => updateSettingsKey(btoa(apiKey)),
                () => {
                  toast.success("key updated");
                  setMode("view");
                },
              )
            }
            disabled={!apiKey}
          >
            save
          </Button>
          <Button size="sm" onClick={() => setMode("view")}>
            cancel
          </Button>
        </div>
      </Card>
    );

  return (
    <Card title="llm provider">
      <p className="text-xs text-muted-foreground">
        select your provider, model, and paste your api key to enable AI analysis.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5" htmlFor="llm-provider">
          <span className="text-xs text-muted-foreground">provider</span>
          <Select
            id="llm-provider"
            className="w-full"
            size="sm"
            value={provider}
            onChange={(e) => changeProvider(e.target.value as LLMProvider)}
          >
            <option value="google">google (gemini)</option>
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
          </Select>
        </label>
        <label className="space-y-1.5" htmlFor="llm-model">
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
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">api key</div>
        <Input
          variant="sm"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="paste your api key..."
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        isLoading={pending}
        loadingText="saving..."
        disabled={!apiKey}
        onClick={() =>
          act(
            () => saveSettings(provider, model, btoa(apiKey)),
            () => {
              toast.success("saved");
              setMode("view");
            },
          )
        }
      >
        save
      </Button>
    </Card>
  );
}
