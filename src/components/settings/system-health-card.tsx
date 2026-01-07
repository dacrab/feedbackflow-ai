"use client";

import { Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [syncProgress, setSyncProgress] = useState<{
    stage: string;
    message: string;
    current?: number;
    total?: number;
  } | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncProgress({ stage: "starting", message: "Starting sync..." });

    try {
      const response = await fetch("/api/sync");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

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
            setSyncProgress(data);
            if (data.stage === "complete") toast.success(data.message);
            else if (data.stage === "error") toast.error(data.message);
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card className="border border-border/60 bg-muted/10 backdrop-blur-sm shadow-none h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="bg-background rounded-lg border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
            Active Sources
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-foreground">{enabledSources}</p>
            <p className="text-xs text-muted-foreground mb-1">/ {totalSources} configured</p>
          </div>
        </div>
        <div className="bg-background rounded-lg border border-border/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
            Active Webhooks
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-foreground">{enabledHooks}</p>
            <p className="text-xs text-muted-foreground mb-1">monitoring alerts</p>
          </div>
        </div>
        <p className="text-xs bg-primary/5 text-primary p-3 rounded border border-primary/10">
          <span className="font-semibold">Tip:</span> Keep at least one source enabled to ensure
          continuous feedback ingestion.
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={syncing || enabledSources === 0}
          onClick={runSync}
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
        {syncProgress && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">{syncProgress.message}</p>
            {syncProgress.total && syncProgress.current !== undefined && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {syncProgress.current} / {syncProgress.total}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
