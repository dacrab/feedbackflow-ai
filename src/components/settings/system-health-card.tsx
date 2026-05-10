"use client";

import { useRef, useState } from "react";
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
  const [logs, setLogs] = useState<{ id: number; msg: string; ok?: boolean }[]>([]);
  const logId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  async function runSync() {
    setSyncing(true);
    setLogs([{ id: logId.current++, msg: "connecting..." }]);

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
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          const ok: true | false | undefined =
            data.stage === "complete" ? true : data.stage === "error" ? false : undefined;
          setLogs((prev) => [
            ...prev,
            { id: logId.current++, msg: data.message as string, ...(ok !== undefined && { ok }) },
          ]);
          setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 10);
          if (data.stage === "complete") toast.success(data.message);
          else if (data.stage === "error") toast.error(data.message);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "sync failed");
      setLogs((prev) => [...prev, { id: logId.current++, msg: "sync failed", ok: false }]);
    } finally {
      setSyncing(false);
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

      {logs.length > 0 && (
        <div
          ref={logRef}
          className="max-h-32 overflow-y-auto rounded border border-border bg-muted/20 p-2 space-y-0.5"
        >
          {logs.map((l) => (
            <p
              key={l.id}
              className={`text-xs font-mono ${
                l.ok === true
                  ? "text-green-500"
                  : l.ok === false
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {l.ok === true ? "✓ " : l.ok === false ? "✗ " : "· "}
              {l.msg}
            </p>
          ))}
          {syncing && (
            <p className="text-xs font-mono text-muted-foreground animate-pulse">· ...</p>
          )}
        </div>
      )}
    </Card>
  );
}
