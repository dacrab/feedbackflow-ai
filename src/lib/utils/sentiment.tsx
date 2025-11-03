/**
 * Sentiment styling utilities
 */

import { cn } from "@/lib/cn";
import type { Sentiment } from "@/lib/types";

type SentimentBadgeProps = {
  sentiment?: string | null | undefined;
  className?: string;
};

function getSentimentBadgeClass(sentiment: Sentiment): string {
  const styles: Record<Sentiment, string> = {
    positive: "bg-emerald-100 text-emerald-700 border-transparent",
    neutral: "bg-slate-100 text-slate-600 border-transparent",
    negative: "bg-rose-100 text-rose-600 border-transparent",
  };
  return styles[sentiment];
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) return null;
  const style = getSentimentBadgeClass(sentiment as Sentiment);
  return <span className={cn("badge capitalize", style, className)}>{sentiment}</span>;
}
