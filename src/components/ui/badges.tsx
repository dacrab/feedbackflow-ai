import type { FeedbackStatus, Sentiment } from "@/lib/types";

const sentimentColor: Record<Sentiment, string> = {
  positive: "text-green-500",
  neutral: "text-muted-foreground",
  negative: "text-red-500",
};

const statusColor: Record<FeedbackStatus, string> = {
  New: "text-muted-foreground",
  Acknowledged: "text-blue-500",
  Actioned: "text-purple-500",
};

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment | null | undefined }) {
  if (!sentiment) return null;
  return <span className={`text-xs ${sentimentColor[sentiment]}`}>{sentiment}</span>;
}

export function StatusBadge({ status }: { status?: FeedbackStatus | null | undefined }) {
  if (!status || status === "New") return null;
  return <span className={`text-xs ${statusColor[status]}`}>[{status.toLowerCase()}]</span>;
}
