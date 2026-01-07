import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: string | null | undefined;
  className?: string;
}

const colors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  Acknowledged: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Actioned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status || status === "New") {
    return null;
  }

  const colorClass = colors[status] ?? "";

  return (
    <span
      className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", colorClass, className)}
    >
      {status}
    </span>
  );
}
