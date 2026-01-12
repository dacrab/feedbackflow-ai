"use client";

import { useState } from "react";
import SettingsItem, { getNotificationLabel } from "@/components/settings/settings-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <Card title="notifications">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input
          variant="sm"
          placeholder="slack webhook url"
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          isLoading={isLoading}
          loadingText="adding..."
          disabled={!slackUrl}
          className="w-full"
        >
          add webhook
        </Button>
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
    </Card>
  );
}
