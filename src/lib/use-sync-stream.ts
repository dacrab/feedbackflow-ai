"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseSSEStream } from "@/lib/sse";
import type { SyncStage } from "@/lib/types";
import { handleActionError } from "@/lib/utils";

export interface SyncLogLine {
  id: string;
  msg: string;
  ok?: boolean | undefined;
  progress?: boolean | undefined;
}

/** Everything the client does per stage, in one table: the log line's success
 *  colour and whether it coalesces, plus whether it also deserves a toast. Kept
 *  as a table so a new stage cannot be wired into one behaviour and forgotten
 *  in another. */
const STAGE_META: Partial<
  Record<SyncStage, { ok?: boolean; progress?: boolean; toast?: "success" | "error" }>
> = {
  analyzing: { progress: true },
  analysis_ok: { ok: true, progress: true },
  analysis_error: { ok: false, progress: true },
  complete: { ok: true, toast: "success" },
  error: { ok: false, toast: "error" },
};

export function useSyncStream() {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLogLine[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const push = useCallback((msg: string, ok?: boolean, progress = false) => {
    setLogs((prev) => {
      const last = prev[prev.length - 1];
      // Only coalesce into a progress line; otherwise a completed step
      // (e.g. "fetched 100") gets erased by the next progress event.
      if (progress && last?.progress) return [...prev.slice(0, -1), { ...last, msg, ok }];
      // A fresh id per line, rather than a ref bumped inside the updater: the
      // updater must stay pure because React may invoke it more than once.
      return [...prev, { id: crypto.randomUUID(), msg, ok, progress }];
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
        const { ok, progress, toast: toastKind } = STAGE_META[stage] ?? {};
        push(message, ok, progress);
        if (toastKind) toast[toastKind](message);
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
