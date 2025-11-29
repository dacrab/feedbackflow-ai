import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface SentimentBadgeProps {
  sentiment?: string | null | undefined;
  className?: string;
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) return null;

  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

  if (sentiment === "positive") variant = "default";
  if (sentiment === "negative") variant = "destructive";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {sentiment}
    </Badge>
  );
}
