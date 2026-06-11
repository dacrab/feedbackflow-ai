"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SentimentBadge, StatusBadge } from "@/components/ui/ui";
import { bulkUpdateStatus } from "@/lib/actions";
import type { FeedbackItemWithAnalysis } from "@/lib/types";
import { formatDateUTC, sevColor, sevLabel } from "@/lib/utils";

export function InboxBulkActions({ items }: { items: FeedbackItemWithAnalysis[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    startTransition(async () => {
      await bulkUpdateStatus(Array.from(selected), status);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-2 rounded border border-border bg-muted text-sm animate-slide-down">
          <span>{selected.size} selected</span>
          <button
            type="button"
            onClick={() => handleBulk("Acknowledged")}
            disabled={isPending}
            className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            Mark Acknowledged
          </button>
          <button
            type="button"
            onClick={() => handleBulk("Actioned")}
            disabled={isPending}
            className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
          >
            Mark Actioned
          </button>
        </div>
      )}

      <div className="rounded border border-border bg-card divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>no items found</p>
            <p className="mt-1">add a data source in settings to get started</p>
          </div>
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
                      <span className="truncate max-w-[200px]">
                        {item.raw_content.slice(0, 120)}
                      </span>
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
