"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, Card, EmptyState, Muted, Panel } from "@/components/ui/ui";
import { parseSSEStream } from "@/lib/sse";
import type { IngestRunSummary } from "@/lib/types";
import { handleActionError, timeAgo } from "@/lib/utils";

function stageToStatus(stage: string): boolean | undefined {
  if (stage === "complete" || stage === "analysis_ok") return true;
  if (stage === "error" || stage === "analysis_error") return false;
  return undefined;
}

function statusInfo(ok: boolean | null | undefined): { cls: string; prefix: string; log: string } {
  if (ok === true) return { cls: "text-green-500", prefix: "● ok", log: "✓ " };
  if (ok === false) return { cls: "text-red-500", prefix: "● failed", log: "✗ " };
  return { cls: "text-muted-foreground", prefix: "● running", log: "· " };
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
  lastRun: IngestRunSummary | null;
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
      const response = await fetch("/api/sync", { method: "POST", signal: ctrl.signal });
      if (!response.ok) throw new Error("sync request failed");

      await parseSSEStream(response, (data) => {
        const stage = data.stage;
        const ok = stageToStatus(stage);
        const msg = data.message;

        const isProgress =
          stage === "analyzing" || stage === "analysis_ok" || stage === "analysis_error";
        setLogs((prev) => {
          const last = prev[prev.length - 1];
          if (isProgress && last) {
            return [...prev.slice(0, -1), { id: last.id, msg, ...(ok !== undefined && { ok }) }];
          }
          return [...prev, { id: logId.current++, msg, ...(ok !== undefined && { ok }) }];
        });

        const el = logRef.current;
        el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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

  const runStatus = lastRun ? statusInfo(lastRun.ok) : null;

  return (
    <div className="relative">
      <Card title="system" className={className ?? ""}>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="sources"
            value={
              <>
                {enabledSources}
                <Muted className="text-sm">/{totalSources}</Muted>
              </>
            }
          />
          <StatTile label="webhooks" value={enabledHooks} />
        </div>

        {lastRun ? (
          <Panel className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Muted>last run</Muted>
              <span className={`text-xs ${runStatus?.cls}`}>{runStatus?.prefix}</span>
            </div>
            <Muted>{timeAgo(lastRun.startedAt)}</Muted>
            <div className="flex gap-3 text-xs">
              <span>
                <span className="text-foreground font-medium">{lastRun.fetched ?? 0}</span>{" "}
                <Muted>fetched</Muted>
              </span>
              <span>
                <span className="text-foreground font-medium">{lastRun.inserted ?? 0}</span>{" "}
                <Muted>new</Muted>
              </span>
              <span>
                <span className="text-foreground font-medium">{lastRun.analyzed ?? 0}</span>{" "}
                <Muted>analyzed</Muted>
              </span>
            </div>
          </Panel>
        ) : (
          <EmptyState title="no runs yet" />
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
          {logs.map((l) => {
            const { cls, log } = statusInfo(l.ok);
            return (
              <p key={l.id} className={`text-xs font-mono truncate ${cls}`}>
                {log}
                {l.msg}
              </p>
            );
          })}
          {syncing && (
            <p className="text-xs font-mono text-muted-foreground animate-pulse">· ...</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel>
      <Muted>{label}</Muted>
      <p className="text-lg font-medium leading-tight">{value}</p>
    </Panel>
  );
}
