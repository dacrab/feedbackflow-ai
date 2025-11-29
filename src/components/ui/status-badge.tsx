import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  status?: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  if (status === "New") variant = "secondary";
  if (status === "Actioned") variant = "default";
  if (status === "Acknowledged") variant = "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}
