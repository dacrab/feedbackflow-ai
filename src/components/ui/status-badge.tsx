interface StatusBadgeProps {
  status?: string | null | undefined;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status || status === "New") return null;

  const color = {
    Acknowledged: "text-blue-500",
    Actioned: "text-purple-500",
  }[status] ?? "text-muted-foreground";

  return <span className={`text-xs ${color}`}>[{status.toLowerCase()}]</span>;
}
