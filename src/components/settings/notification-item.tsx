/**
 * Reusable notification item component for settings page
 */

import { toast } from "sonner";
import Button from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TransformedNotificationRow } from "@/lib/types";

interface NotificationItemProps {
  notification: TransformedNotificationRow;
  onUpdate: () => void;
}

export default function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/notifications/${notification.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !notification.enabled }),
    });
    if (res.ok) {
      onUpdate();
    } else {
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/notifications/${notification.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Notification deleted");
      onUpdate();
    } else {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium text-foreground">
          {notification.type === "slack" ? "Slack webhook" : notification.type}
        </p>
        <span
          className={cn(
            "badge mt-2",
            notification.enabled
              ? "bg-emerald-100 text-emerald-700 border-transparent"
              : "bg-slate-100 text-slate-600 border-transparent",
          )}
        >
          {notification.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div className="flex gap-2">
        <form onSubmit={handleToggle}>
          <Button size="sm" variant="outline" type="submit">
            {notification.enabled ? "Disable" : "Enable"}
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
