"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, SentimentBadge, StatusBadge, statusChip } from "@/components/ui/ui";
import { bulkUpdateStatus } from "@/lib/actions";
import type { FeedbackItemWithAnalysis } from "@/lib/types";
import { useAction } from "@/lib/use-action";
import { cn, formatDateUTC, sevColor, sevLabel } from "@/lib/utils";

const BULK_STATUSES: readonly ("Acknowledged" | "Actioned")[] = ["Acknowledged", "Actioned"];

export function InboxBulkActions({ items }: { items: FeedbackItemWithAnalysis[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { run, pending: isPending } = useAction();

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulk(status: string) {
    // Only clear the selection on success; failures surface via toast.
    run(() => bulkUpdateStatus(Array.from(selected), status), "status updated").then((ok) => {
      if (ok) setSelected(new Set());
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-2 rounded border border-border bg-muted text-sm animate-slide-down">
          <span>{selected.size} selected</span>
          {BULK_STATUSES.map((status) => (
            <Button
              key={status}
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => handleBulk(status)}
              disabled={isPending}
              className={cn(statusChip[status])}
            >
              Mark {status}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded border border-border bg-card divide-y divide-border">
        {items.length === 0 ? (
          <EmptyState
            title="no items found"
            hint="feedback appears here once it has been ingested and analyzed"
          />
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 text-xs text-muted-foreground border-b border-border">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all items"
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span>select all</span>
            </div>
            {items.map((item) => {
              const analysis = item.feedback_analyses;
              const severity = analysis?.severity_score ?? 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group animate-fade-up"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Select: ${analysis?.summary || "feedback item"}`}
                    className="h-3.5 w-3.5 rounded border-border shrink-0"
                  />

                  <div
                    className={`text-xs font-mono font-medium w-5 text-center shrink-0 ${sevColor(severity)}`}
                    title={sevLabel(severity)}
                    role="img"
                    aria-label={sevLabel(severity)}
                  >
                    {severity || "·"}
                  </div>

                  <Link href={`/feedback/${item.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate">{analysis?.summary || "no summary"}</span>
                      <SentimentBadge sentiment={analysis?.sentiment} />
                      <StatusBadge status={analysis?.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px]">{item.raw_content}</span>
                      {analysis?.topics?.[0] && (
                        <>
                          <span>·</span>
                          <span>[{analysis.topics[0]}]</span>
                        </>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span suppressHydrationWarning>{formatDateUTC(item.created_at)}</span>
                    <IconChevronRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
