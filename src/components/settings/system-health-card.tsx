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

/** The dot colour, run label and log prefix for one outcome, in one place so the
 *  three cannot disagree. */
type Outcome = keyof typeof statusToneClass;
const OUTCOME: Record<Outcome, { label: string; prefix: string }> = {
  ok: { label: "● ok", prefix: "✓ " },
  bad: { label: "● failed", prefix: "✗ " },
  idle: { label: "● running", prefix: "· " },
};

const outcomeFor = (ok: boolean | null): Outcome => {
  if (ok === null) return "idle";
  return ok ? "ok" : "bad";
};

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Panel>
      <Muted>{label}</Muted>
      <p className="text-lg leading-tight font-medium">{value}</p>
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
      className="animate-slide-down border-border bg-card absolute inset-x-0 top-full z-10 mt-1 max-h-36 overflow-y-auto rounded border p-2 shadow-lg"
    >
      {/* Announced as updates stream in; the ✓/✗/· prefix is the non-colour cue. */}
      <div role="log" aria-live="polite" aria-label="sync log" className="space-y-0.5">
        {logs.map((line) => {
          const outcome = outcomeFor(line.ok ?? null);
          return (
            <p key={line.id} className={`truncate font-mono text-xs ${statusToneClass[outcome]}`}>
              {OUTCOME[outcome].prefix}
              {line.msg}
            </p>
          );
        })}
        {syncing && <p className="text-muted-foreground animate-pulse font-mono text-xs">· ...</p>}
      </div>
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
  const lastOutcome = outcomeFor(lastRun?.ok ?? null);

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
              <StatusDot tone={lastOutcome}>{OUTCOME[lastOutcome].label}</StatusDot>
            </div>
            <Muted>
              {timeAgo(lastRun.startedAt)}
              {lastRun.finishedAt && ` · ${timeAgo(lastRun.finishedAt)}`}
            </Muted>
            {lastRun.error && (
              <div className="text-danger font-mono text-xs break-words">{lastRun.error}</div>
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
