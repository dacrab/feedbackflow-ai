/**
 * Reusable source item component for settings page
 */

import { toast } from "sonner";
import Button from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TransformedSourceRow } from "@/lib/types";

interface SourceItemProps {
  source: TransformedSourceRow;
  onUpdate: () => void;
}

export default function SourceItem({ source, onUpdate }: SourceItemProps) {
  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !source.enabled }),
    });
    if (res.ok) {
      onUpdate();
    } else {
      toast.error("Failed to update source");
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/sources/${source.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Source deleted");
      onUpdate();
    } else {
      toast.error("Failed to delete source");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium text-foreground">
          {source.type === "github" ? "GitHub Issues" : source.type}
        </p>
        <p className="text-xs text-muted-foreground">
          {source.config && typeof source.config === "object" && "repo" in source.config
            ? String(source.config["repo"])
            : "Custom configuration"}
        </p>
        <span
          className={cn(
            "badge mt-2",
            source.enabled
              ? "bg-emerald-100 text-emerald-700 border-transparent"
              : "bg-slate-100 text-slate-600 border-transparent",
          )}
        >
          {source.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div className="flex gap-2">
        <form onSubmit={handleToggle}>
          <Button size="sm" variant="outline" type="submit">
            {source.enabled ? "Disable" : "Enable"}
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
