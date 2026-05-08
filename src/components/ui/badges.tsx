export function SentimentBadge({ sentiment }: { sentiment?: string | null | undefined }) {
  if (!sentiment) return null;
  const color = ({ positive: "text-green-500", neutral: "text-muted-foreground", negative: "text-red-500" } as Record<string, string>)[sentiment] ?? "text-muted-foreground";
  return <span className={`text-xs ${color}`}>{sentiment}</span>;
}

export function StatusBadge({ status }: { status?: string | null | undefined }) {
  if (!status || status === "New") return null;
  const color = ({ Acknowledged: "text-blue-500", Actioned: "text-purple-500" } as Record<string, string>)[status] ?? "text-muted-foreground";
  return <span className={`text-xs ${color}`}>[{status.toLowerCase()}]</span>;
}
