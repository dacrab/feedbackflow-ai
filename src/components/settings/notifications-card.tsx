"use client";

import { useState } from "react";
import SettingsItem, { getNotificationLabel } from "@/components/settings/settings-item";
import { useApiMutation } from "@/hooks";
import type { TransformedNotificationRow } from "@/lib/types";

interface NotificationsCardProps {
  hooks: Array<TransformedNotificationRow>;
  onRefetch: () => void;
}

export function NotificationsCard({ hooks, onRefetch }: NotificationsCardProps) {
  const [slackUrl, setSlackUrl] = useState("");

  const { mutate: createNotification, isLoading } = useApiMutation({
    successMessage: "webhook added",
    errorMessage: "failed to add webhook",
    onSuccess: () => {
      setSlackUrl("");
      onRefetch();
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createNotification("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "slack", webhook: slackUrl }),
    });
  }

  return (
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <p className="text-xs text-muted-foreground">// notifications</p>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          placeholder="slack webhook url"
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
          className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={isLoading || !slackUrl}
          className="w-full h-8 rounded border border-border text-sm hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {isLoading ? "adding..." : "add webhook"}
        </button>
      </form>

      <div className="space-y-2 border-t border-border pt-4">
        {hooks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">no webhooks</p>
        ) : (
          hooks.map((h) => (
            <SettingsItem
              key={h.id}
              item={h}
              apiPath="notifications"
              onUpdate={onRefetch}
              label={getNotificationLabel(h.type)}
            />
          ))
        )}
      </div>
    </div>
  );
}
