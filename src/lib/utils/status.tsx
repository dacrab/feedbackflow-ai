/**
 * Status badge utilities
 */

import { cn } from "@/lib/cn";
import type { FeedbackStatus } from "@/lib/types";

type StatusBadgeProps = {
  status?: string | null | undefined;
  className?: string;
};

function getStatusBadgeClass(status: FeedbackStatus): string {
  const styles: Record<FeedbackStatus, string> = {
    New: "bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-foreground border-transparent",
    Acknowledged: "bg-amber-100 text-amber-700 border-transparent",
    Actioned: "bg-emerald-100 text-emerald-700 border-transparent",
  };
  return styles[status];
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;
  const style = getStatusBadgeClass(status as FeedbackStatus);
  return <span className={cn("badge", style, className)}>{status}</span>;
}
