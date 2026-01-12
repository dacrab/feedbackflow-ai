"use client";

import { useState } from "react";
import { toast } from "sonner";

interface SystemHealthCardProps {
  enabledSources: number;
  totalSources: number;
  enabledHooks: number;
}

export function SystemHealthCard({
  enabledSources,
  totalSources,
  enabledHooks,
}: SystemHealthCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setProgress("starting...");

    try {
      const response = await fetch("/api/sync");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("no reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            setProgress(data.message);
            if (data.stage === "complete") toast.success(data.message);
            else if (data.stage === "error") toast.error(data.message);
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "sync failed");
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  }

  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <p className="text-xs text-muted-foreground">// system</p>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">sources</p>
          <p className="text-lg font-medium">
            {enabledSources}
            <span className="text-muted-foreground text-sm">/{totalSources}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">webhooks</p>
          <p className="text-lg font-medium">{enabledHooks}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={syncing || enabledSources === 0}
        onClick={runSync}
        className="w-full h-8 rounded border border-border text-sm hover:bg-muted disabled:opacity-50 transition-colors"
      >
        {syncing ? "syncing..." : "sync now"}
      </button>

      {progress && <p className="text-xs text-muted-foreground text-center">{progress}</p>}
    </div>
  );
}
