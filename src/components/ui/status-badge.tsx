/**
 * Status badge utilities
 */

import { cn } from "@/lib/cn";
import type { FeedbackStatus } from "@/lib/types";

type StatusBadgeProps = {
  status?: string | null | undefined;
  className?: string;
};

const statusStyles: Record<FeedbackStatus, string> = {
  New: "badge-new",
  Acknowledged: "badge-acknowledged",
  Actioned: "badge-actioned",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;
  const style = statusStyles[status as FeedbackStatus];
  return <span className={cn("badge", style, className)}>{status}</span>;
}
