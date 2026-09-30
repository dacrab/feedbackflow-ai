"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseSSEStream } from "@/lib/sse";
import { handleActionError } from "@/lib/utils";

export interface SyncLogLine {
  id: number;
  msg: string;
  ok?: boolean | undefined;
  progress?: boolean | undefined;
}

const PROGRESS_STAGES = new Set(["analyzing", "analysis_ok", "analysis_error"]);

function stageOk(stage: string): boolean | undefined {
  if (stage === "complete" || stage === "analysis_ok") return true;
  if (stage === "error" || stage === "analysis_error") return false;
  return undefined;
}

export function useSyncStream() {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLogLine[]>([]);
  const nextId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const push = useCallback((msg: string, ok?: boolean, progress = false) => {
    setLogs((prev) => {
      const last = prev[prev.length - 1];
      // Only coalesce into a progress line; otherwise a completed step
      // (e.g. "fetched 100") gets erased by the next progress event.
      if (progress && last?.progress) return [...prev.slice(0, -1), { ...last, msg, ok }];
      return [...prev, { id: nextId.current++, msg, ok, progress }];
    });
  }, []);

  // Never leave a 300-second request streaming after the card unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSyncing(false);
    push("cancelled", false);
  }, [push]);

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSyncing(true);
    push("connecting...");

    try {
      const response = await fetch("/api/sync", { method: "POST", signal: ctrl.signal });
      if (!response.ok) throw new Error("sync request failed");

      await parseSSEStream(response, ({ stage, message }) => {
        push(message, stageOk(stage), PROGRESS_STAGES.has(stage));
        if (stage === "complete") toast.success(message);
        if (stage === "error") toast.error(message);
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(handleActionError(err, "sync failed"));
      push("sync failed", false);
    } finally {
      // Only release state this run owns, so a late-finishing run cannot
      // un-cancel or un-hide a newer one.
      if (abortRef.current === ctrl) abortRef.current = null;
      setSyncing(false);
    }
  }, [push]);

  return { syncing, logs, start, cancel };
}
