"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SettingsItemProps {
  item: { id: string; type: string; enabled: boolean; config?: Record<string, unknown> | null };
  apiPath: "sources" | "notifications";
  label: string;
  description?: string;
}

export default function SettingsItem({ item, apiPath, label, description }: SettingsItemProps) {
  const router = useRouter();

  async function call(init: RequestInit, successMsg?: string) {
    const res = await fetch(`/api/${apiPath}/${item.id}`, init);
    if (res.ok) { if (successMsg) toast.success(successMsg); router.refresh(); }
    else toast.error("failed to update");
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
          onClick={() => call({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !item.enabled }) })}
          className="h-7 px-2 rounded border border-border text-xs hover:bg-muted transition-colors"
        >
          {item.enabled ? "disable" : "enable"}
        </button>
        <button
          type="button"
          onClick={() => call({ method: "DELETE" }, "deleted")}
          className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          delete
        </button>
      </div>
    </div>
  );
}
