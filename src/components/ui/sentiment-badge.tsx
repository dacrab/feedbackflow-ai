import { cn } from "@/lib/utils";

interface SentimentBadgeProps {
  sentiment?: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

const colors: Record<string, string> = {
  positive: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function SentimentBadge({ sentiment, size = "sm", className }: SentimentBadgeProps) {
  if (!sentiment) {
    return null;
  }

  const colorClass = colors[sentiment] ?? colors["neutral"];

  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium capitalize",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        colorClass,
        className,
      )}
    >
      {sentiment}
    </span>
  );
}
