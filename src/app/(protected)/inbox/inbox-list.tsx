"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import {
  Button,
  EmptyState,
  Muted,
  Rows,
  SentimentBadge,
  SeverityChip,
  StatusBadge,
  statusChipClass,
  TopicTag,
} from "@/components/ui/ui";
import { bulkUpdateStatus } from "@/lib/actions";
import type { FeedbackItemWithAnalysis, FeedbackStatus } from "@/lib/types";
import { useAction } from "@/lib/use-action";
import { formatDateUTC } from "@/lib/utils";

const BULK_STATUSES: readonly Exclude<FeedbackStatus, "New">[] = ["Acknowledged", "Actioned"];

/** The inbox rows and the bar that acts on the selected ones. Selection lives
 *  here because the checkboxes and the bulk buttons have to agree about what is
 *  selected, and the page that owns them is a server component. */
export function InboxList({ items }: { items: FeedbackItemWithAnalysis[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { run, pending: isPending } = useAction();

  // Membership, not a count: two pages of equal size would otherwise show
  // "select all" checked with nothing visible selected.
  const visible = items.map((i) => i.id);
  const selectedOnPage = visible.filter((id) => selected.has(id));
  const allSelected = visible.length > 0 && selectedOnPage.length === visible.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visible));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulk(status: Exclude<FeedbackStatus, "New">) {
    run(() => bulkUpdateStatus(selectedOnPage, status), "status updated").then((ok) => {
      if (ok) setSelected(new Set());
    });
  }

  return (
    <>
      {selectedOnPage.length > 0 && (
        <div className="animate-slide-down border-border bg-muted flex items-center gap-3 rounded border p-2 text-sm">
          <span>{selectedOnPage.length} selected</span>
          {BULK_STATUSES.map((status) => (
            <Button
              key={status}
              variant="ghost"
              onClick={() => handleBulk(status)}
              disabled={isPending}
              className={statusChipClass(status)}
            >
              Mark {status}
            </Button>
          ))}
        </div>
      )}

      <Rows className="bg-card">
        {items.length === 0 ? (
          <EmptyState
            title="no items found"
            hint="feedback appears here once it has been ingested and analyzed"
          />
        ) : (
          <>
            <div className="border-border text-muted-foreground flex items-center gap-3 border-b p-3 text-xs">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all items"
                className="border-border size-3.5 rounded"
              />
              <Muted>select all</Muted>
            </div>
            {items.map((item) => {
              const analysis = item.feedback_analyses;
              const topic = analysis?.topics[0];

              return (
                <div
                  key={item.id}
                  className="group animate-fade-up hover:bg-muted/50 flex items-center gap-3 p-3 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Select: ${analysis?.summary || "feedback item"}`}
                    className="border-border size-3.5 shrink-0 rounded"
                  />

                  <SeverityChip
                    score={analysis?.severity_score ?? 0}
                    className="w-5 shrink-0 text-center"
                  />

                  <Link href={`/feedback/${item.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate">{analysis?.summary || "no summary"}</span>
                      <SentimentBadge sentiment={analysis?.sentiment} />
                      <StatusBadge status={analysis?.status} />
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                      <Muted className="max-w-[200px] truncate">{item.raw_content}</Muted>
                      {topic && <TopicTag topic={topic} />}
                    </div>
                  </Link>

                  <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                    <Muted suppressHydrationWarning>{formatDateUTC(item.created_at)}</Muted>
                    <IconChevronRight className="group-hover:text-foreground size-3.5 transition-colors" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Rows>
    </>
  );
}
