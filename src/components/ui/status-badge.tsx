export function StatusBadge({ status }: { status?: string | null | undefined }) {
  if (!status || status === "New") return null;

  const color =
    {
      Acknowledged: "text-blue-500",
      Actioned: "text-purple-500",
    }[status] ?? "text-muted-foreground";

  return <span className={`text-xs ${color}`}>[{status.toLowerCase()}]</span>;
}
