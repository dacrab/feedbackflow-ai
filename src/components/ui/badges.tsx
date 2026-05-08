import type { FeedbackStatus, Sentiment } from "@/lib/types";

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment | null | undefined }) {
  if (!sentiment) return null;
  const colorMap: Record<Sentiment, string> = {
    positive: "text-green-500",
    neutral: "text-muted-foreground",
    negative: "text-red-500",
  };
  return <span className={`text-xs ${colorMap[sentiment]}`}>{sentiment}</span>;
}

export function StatusBadge({ status }: { status?: FeedbackStatus | null | undefined }) {
  if (!status || status === "New") return null;
  const colorMap: Record<FeedbackStatus, string> = {
    New: "text-muted-foreground",
    Acknowledged: "text-blue-500",
    Actioned: "text-purple-500",
  };
  return <span className={`text-xs ${colorMap[status]}`}>[{status.toLowerCase()}]</span>;
}
