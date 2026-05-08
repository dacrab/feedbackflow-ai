"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui/ui";

export function SystemHealthCard({
  enabledSources,
  totalSources,
  enabledHooks,
}: {
  enabledSources: number;
  totalSources: number;
  enabledHooks: number;
}) {
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
    <Card title="system">
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

      <Button
        size="sm"
        isLoading={syncing}
        loadingText="syncing..."
        disabled={enabledSources === 0}
        onClick={runSync}
        className="w-full"
      >
        sync now
      </Button>

      {progress && <p className="text-xs text-muted-foreground text-center">{progress}</p>}
    </Card>
  );
}
