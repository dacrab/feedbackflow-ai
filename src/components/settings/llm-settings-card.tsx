"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Input, Select } from "@/components/ui/ui";
import {
  deleteSettings,
  saveSettings,
  updateSettingsKey,
  updateSettingsModel,
} from "@/lib/actions";
import type { LLMProvider } from "@/lib/types";

type Mode = "view" | "add" | "edit-model" | "update-key";

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <p className="text-xs text-muted-foreground">// llm provider</p>
      {children}
    </div>
  );
}

export function LLMSettingsCard({
  initialProvider,
  initialModel,
}: {
  initialProvider: LLMProvider | null;
  initialModel: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialProvider && initialModel ? "view" : "add");
  const [provider, setProvider] = useState<LLMProvider>(initialProvider ?? "google");
  const [model, setModel] = useState(initialModel ?? "");
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

  if (mode === "view")
    return (
      <Wrap>
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
              setModel(initialModel ?? "");
              setMode("edit-model");
            }}
          >
            edit model
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
                setModel("");
                setApiKey("");
              })
            }
            className="h-8 px-3 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            remove
          </button>
        </div>
      </Wrap>
    );

  if (mode === "edit-model")
    return (
      <Wrap>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            model <span className="text-foreground">({initialProvider})</span>
          </p>
          <Input
            variant="sm"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gpt-4o, gemini-2.5-pro"
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
                () => updateSettingsModel(model),
                () => {
                  toast.success("model updated");
                  setMode("view");
                },
              )
            }
            disabled={!model}
          >
            save
          </Button>
          <Button size="sm" onClick={() => setMode("view")}>
            cancel
          </Button>
        </div>
      </Wrap>
    );

  if (mode === "update-key")
    return (
      <Wrap>
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
            placeholder="sk-..."
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
                () => updateSettingsKey(apiKey),
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
      </Wrap>
    );

  return (
    <Wrap>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5" htmlFor="llm-provider">
          <span className="text-xs text-muted-foreground">provider</span>
          <Select
            id="llm-provider"
            className="w-full"
            size="sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value as LLMProvider)}
          >
            <option value="google">google (gemini)</option>
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
          </Select>
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
        <div className="text-xs text-muted-foreground">api key</div>
        <Input
          variant="sm"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        isLoading={pending}
        loadingText="saving..."
        disabled={!model || !apiKey}
        onClick={() =>
          act(
            () => saveSettings(provider, model, apiKey),
            () => {
              toast.success("saved");
              setMode("view");
            },
          )
        }
      >
        save
      </Button>
    </Wrap>
  );
}
