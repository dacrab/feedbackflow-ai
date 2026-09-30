"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  Muted,
  Panel,
  StatusDot,
  statusToneClass,
  TextButton,
} from "@/components/ui/ui";
import type { IngestRunSummary } from "@/lib/types";
import { type SyncLogLine, useSyncStream } from "@/lib/use-sync-stream";
import { timeAgo } from "@/lib/utils";

const runLabel = (ok: boolean | null): string =>
  ok === true ? "● ok" : ok === false ? "● failed" : "● running";

const runTone = (ok: boolean | null) => (ok === null ? "idle" : ok ? "ok" : "bad");

const logPrefix = (ok: boolean | undefined): string =>
  ok === true ? "✓ " : ok === false ? "✗ " : "· ";

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel>
      <Muted>{label}</Muted>
      <p className="text-lg font-medium leading-tight">{value}</p>
    </Panel>
  );
}

function RunCount({ value, label }: { value: number | null; label: string }) {
  return (
    <span>
      <span className="text-foreground font-medium">{value ?? 0}</span> <Muted>{label}</Muted>
    </span>
  );
}

function SyncLog({
  logs,
  syncing,
  onDismiss,
}: {
  logs: SyncLogLine[];
  syncing: boolean;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The body only reads the ref, so the linter cannot see that `logs` is the
  // real dependency.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on log changes
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full z-10 mt-1 max-h-36 overflow-y-auto rounded border border-border bg-card p-2 space-y-0.5 shadow-lg animate-slide-down"
    >
      {logs.map((line) => (
        <p
          key={line.id}
          className={`text-xs font-mono truncate ${statusToneClass[runTone(line.ok ?? null)]}`}
        >
          {logPrefix(line.ok)}
          {line.msg}
        </p>
      ))}
      {syncing && <p className="text-xs font-mono text-muted-foreground animate-pulse">· ...</p>}
      <TextButton className="w-full text-left" onClick={onDismiss}>
        dismiss
      </TextButton>
    </div>
  );
}

export function SystemHealthCard({
  enabledSources,
  totalSources,
  enabledHooks,
  lastRun,
}: {
  enabledSources: number;
  totalSources: number;
  enabledHooks: number;
  lastRun: IngestRunSummary | null;
}) {
  const { syncing, logs, start, cancel } = useSyncStream();
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="relative">
      <Card title="system">
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
              <StatusDot tone={runTone(lastRun.ok)}>{runLabel(lastRun.ok)}</StatusDot>
            </div>
            <Muted>
              {timeAgo(lastRun.startedAt)}
              {lastRun.finishedAt && ` · ${timeAgo(lastRun.finishedAt)}`}
            </Muted>
            {lastRun.error && (
              <div className="font-mono text-xs text-danger break-words">{lastRun.error}</div>
            )}
            <div className="flex gap-3 text-xs">
              <RunCount value={lastRun.fetched} label="fetched" />
              <RunCount value={lastRun.inserted} label="new" />
              <RunCount value={lastRun.analyzed} label="analyzed" />
            </div>
          </Panel>
        ) : (
          <EmptyState title="no runs yet" />
        )}

        {syncing ? (
          <Button onClick={cancel} className="w-full">
            cancel sync
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={enabledSources === 0}
            onClick={() => {
              setLogOpen(true);
              start();
            }}
            className="w-full"
          >
            sync now
          </Button>
        )}
      </Card>

      {logOpen && logs.length > 0 && (
        <SyncLog logs={logs} syncing={syncing} onDismiss={() => setLogOpen(false)} />
      )}
    </div>
  );
}
