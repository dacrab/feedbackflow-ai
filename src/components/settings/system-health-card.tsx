"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui/ui";
import { handleActionError, timeAgo } from "@/lib/utils";

type LastRun = {
  startedAt: Date;
  finishedAt: Date | null;
  ok: boolean | null;
  fetched: number | null;
  inserted: number | null;
  analyzed: number | null;
} | null;

interface SyncEvent {
  stage: string;
  message: string;
}

function stageToStatus(stage: string): boolean | undefined {
  if (stage === "complete" || stage === "analysis_ok") return true;
  if (stage === "error" || stage === "analysis_error") return false;
  return undefined;
}

async function parseSSE(response: Response, onEvent: (e: SyncEvent) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("no reader");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (!block.startsWith("data: ")) continue;
      onEvent(JSON.parse(block.slice(6)) as SyncEvent);
    }
  }
}

function statusInfo(ok: boolean | null | undefined): { cls: string; prefix: string } {
  if (ok === true) return { cls: "text-green-500", prefix: "● ok" };
  if (ok === false) return { cls: "text-red-500", prefix: "● failed" };
  return { cls: "text-muted-foreground", prefix: "● running" };
}

function logPrefix(ok: boolean | null | undefined): string {
  if (ok === true) return "✓ ";
  if (ok === false) return "✗ ";
  return "· ";
}

export function SystemHealthCard({
  enabledSources,
  totalSources,
  enabledHooks,
  lastRun,
  className,
}: {
  enabledSources: number;
  totalSources: number;
  enabledHooks: number;
  lastRun: LastRun;
  className?: string;
}) {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<{ id: number; msg: string; ok?: boolean }[]>([]);
  const logId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setSyncing(false);
    setLogs((prev) => [...prev, { id: logId.current++, msg: "cancelled", ok: false }]);
  }

  async function runSync() {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSyncing(true);
    setLogs([{ id: logId.current++, msg: "connecting..." }]);

    try {
      const response = await fetch("/api/sync", { signal: ctrl.signal });
      if (!response.ok) throw new Error("sync request failed");

      await parseSSE(response, (data) => {
        const stage = data.stage;
        const ok = stageToStatus(stage);
        const msg = data.message;

        // Progress stages (analyzing/ok/error per item) replace the last line in-place
        const isProgress =
          stage === "analyzing" || stage === "analysis_ok" || stage === "analysis_error";
        setLogs((prev) => {
          const last = prev[prev.length - 1];
          if (isProgress && last) {
            return [...prev.slice(0, -1), { id: last.id, msg, ...(ok !== undefined && { ok }) }];
          }
          return [...prev, { id: logId.current++, msg, ...(ok !== undefined && { ok }) }];
        });

        logRef.current?.scrollTo({ top: 9999, behavior: "smooth" });
        if (stage === "complete") toast.success(msg);
        if (stage === "error") {
          toast.error(msg);
          setSyncing(false);
          abortRef.current = null;
        }
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(handleActionError(err, "sync failed"));
      setLogs((prev) => [...prev, { id: logId.current++, msg: "sync failed", ok: false }]);
    } finally {
      setSyncing(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="relative">
      <Card title="system" className={className ?? ""}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-border bg-muted/20 px-3 py-2">
            <p className="text-xs text-muted-foreground">sources</p>
            <p className="text-lg font-medium leading-tight">
              {enabledSources}
              <span className="text-sm text-muted-foreground">/{totalSources}</span>
            </p>
          </div>
          <div className="rounded border border-border bg-muted/20 px-3 py-2">
            <p className="text-xs text-muted-foreground">webhooks</p>
            <p className="text-lg font-medium leading-tight">{enabledHooks}</p>
          </div>
        </div>

        {lastRun ? (
          <div className="rounded border border-border bg-muted/20 px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">last run</p>
              <span className={`text-xs ${statusInfo(lastRun.ok).cls}`}>
                {statusInfo(lastRun.ok).prefix}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo(lastRun.startedAt)}</p>
            <div className="flex gap-3 text-xs">
              <span>
                <span className="text-foreground font-medium">{lastRun.fetched ?? 0}</span>{" "}
                <span className="text-muted-foreground">fetched</span>
              </span>
              <span>
                <span className="text-foreground font-medium">{lastRun.inserted ?? 0}</span>{" "}
                <span className="text-muted-foreground">new</span>
              </span>
              <span>
                <span className="text-foreground font-medium">{lastRun.analyzed ?? 0}</span>{" "}
                <span className="text-muted-foreground">analyzed</span>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">no runs yet</p>
        )}

        {syncing ? (
          <Button size="sm" onClick={cancel} className="w-full">
            cancel sync
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            disabled={enabledSources === 0}
            onClick={runSync}
            className="w-full"
          >
            sync now
          </Button>
        )}
      </Card>

      {logs.length > 0 && (
        <div
          ref={logRef}
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-36 overflow-y-auto rounded border border-border bg-card p-2 space-y-0.5 shadow-lg animate-slide-down"
        >
          {logs.map((l) => (
            <p key={l.id} className={`text-xs font-mono ${statusInfo(l.ok).cls}`}>
              {logPrefix(l.ok)}
              {l.msg}
            </p>
          ))}
          {syncing && (
            <p className="text-xs font-mono text-muted-foreground animate-pulse">· ...</p>
          )}
        </div>
      )}
    </div>
  );
}
