"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteNotification, deleteSource, updateNotification, updateSource } from "@/lib/actions";

interface SettingsItemProps {
  item: { id: string; type: string; enabled: boolean; config?: Record<string, unknown> | null };
  apiPath: "sources" | "notifications";
  label: string;
  description?: string;
}

export default function SettingsItem({ item, apiPath, label, description }: SettingsItemProps) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        if (apiPath === "sources") await updateSource(item.id, { enabled: !item.enabled });
        else await updateNotification(item.id, { enabled: !item.enabled });
      } catch { toast.error("failed to update"); }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        if (apiPath === "sources") await deleteSource(item.id);
        else await deleteNotification(item.id);
        toast.success("deleted");
      } catch { toast.error("failed to delete"); }
    });
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
        <button type="button" onClick={toggle} disabled={pending} className="h-7 px-2 rounded border border-border text-xs hover:bg-muted transition-colors disabled:opacity-50">
          {item.enabled ? "disable" : "enable"}
        </button>
        <button type="button" onClick={remove} disabled={pending} className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
          delete
        </button>
      </div>
    </div>
  );
}
