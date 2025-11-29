/**
 * Unified settings item component for sources and notifications
 */

import { toast } from "sonner";
import Button from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface BaseItem {
  id: string;
  type: string;
  enabled: boolean;
  config?: Record<string, unknown> | null;
}

interface SettingsItemProps<T extends BaseItem> {
  item: T;
  apiPath: "sources" | "notifications";
  onUpdate: () => void;
  label: string;
  description?: string;
}

export default function SettingsItem<T extends BaseItem>({
  item,
  apiPath,
  onUpdate,
  label,
  description,
}: SettingsItemProps<T>) {
  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/${apiPath}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    if (res.ok) {
      onUpdate();
    } else {
      toast.error(`Failed to update ${apiPath.slice(0, -1)}`);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/${apiPath}/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`${apiPath === "sources" ? "Source" : "Notification"} deleted`);
      onUpdate();
    } else {
      toast.error(`Failed to delete ${apiPath.slice(0, -1)}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <span className={cn("badge mt-2", item.enabled ? "badge-enabled" : "badge-disabled")}>
          {item.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div className="flex gap-2">
        <form onSubmit={handleToggle}>
          <Button size="sm" variant="outline" type="submit">
            {item.enabled ? "Disable" : "Enable"}
          </Button>
        </form>
        <form onSubmit={handleDelete}>
          <Button size="sm" variant="ghost" type="submit">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}

export function getSourceLabel(type: string): string {
  return type === "github" ? "GitHub Issues" : type;
}

export function getSourceDescription(config: Record<string, unknown> | null | undefined): string {
  if (config && typeof config === "object" && "repo" in config) {
    return String(config["repo"]);
  }
  return "Custom configuration";
}

export function getNotificationLabel(type: string): string {
  return type === "slack" ? "Slack webhook" : type;
}
