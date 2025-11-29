/**
 * Sentiment styling utilities
 */

import { cn } from "@/lib/cn";
import type { Sentiment } from "@/lib/types";

type SentimentBadgeProps = {
  sentiment?: string | null | undefined;
  className?: string;
};

const sentimentStyles: Record<Sentiment, string> = {
  positive: "badge-positive",
  neutral: "badge-neutral",
  negative: "badge-negative",
};

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) return null;
  const style = sentimentStyles[sentiment as Sentiment];
  return <span className={cn("badge capitalize", style, className)}>{sentiment}</span>;
}
