interface SentimentBadgeProps {
  sentiment?: string | null | undefined;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (!sentiment) return null;

  const color =
    {
      positive: "text-green-500",
      neutral: "text-muted-foreground",
      negative: "text-red-500",
    }[sentiment] ?? "text-muted-foreground";

  return <span className={`text-xs ${color}`}>{sentiment}</span>;
}
