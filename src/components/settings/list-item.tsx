import { Button, Panel } from "@/components/ui/ui";

export function ListItem({ children }: { children: React.ReactNode }) {
  return <Panel className="py-2.5 space-y-2">{children}</Panel>;
}

export function ListSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 border-t border-border pt-3">{children}</div>;
}

export function EnabledStatus({ enabled }: { enabled: boolean }) {
  return (
    <span className={`text-xs ${enabled ? "text-green-500" : "text-muted-foreground"}`}>
      {enabled ? "● enabled" : "○ disabled"}
    </span>
  );
}

export function RowActions({
  enabled,
  pending,
  onToggle,
  onDelete,
}: {
  enabled: boolean;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1.5 shrink-0">
      <Button size="xs" variant="outline" disabled={pending} onClick={onToggle}>
        {enabled ? "disable" : "enable"}
      </Button>
      <Button size="xs" variant="ghost" disabled={pending} onClick={onDelete}>
        delete
      </Button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-center py-6 space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
