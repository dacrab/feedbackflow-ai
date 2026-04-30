import { toast } from "sonner";

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
  async function handleToggle() {
    const res = await fetch(`/api/${apiPath}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    if (res.ok) onUpdate();
    else toast.error("failed to update");
  }

  async function handleDelete() {
    const res = await fetch(`/api/${apiPath}/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("deleted");
      onUpdate();
    } else {
      toast.error("failed to delete");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded border border-border bg-muted/20 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm truncate">{label}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        <span className={`text-xs ${item.enabled ? "text-green-500" : "text-muted-foreground"}`}>
          {item.enabled ? "● enabled" : "○ disabled"}
        </span>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleToggle}
          className="h-7 px-2 rounded border border-border text-xs hover:bg-muted transition-colors"
        >
          {item.enabled ? "disable" : "enable"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          delete
        </button>
      </div>
    </div>
  );
}
