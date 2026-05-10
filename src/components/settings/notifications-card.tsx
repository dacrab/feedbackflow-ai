"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import SettingsItem from "@/components/settings/settings-item";
import { Button, Card, Input } from "@/components/ui/ui";
import type { SlackNotificationConfig } from "@/db/schema";
import { addNotification } from "@/lib/actions";

type NotificationRow = {
  id: string;
  type: "slack";
  config: SlackNotificationConfig;
  enabled: boolean;
};

export function NotificationsCard({ hooks }: { hooks: NotificationRow[] }) {
  const [slackUrl, setSlackUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addNotification(slackUrl);
        setSlackUrl("");
        toast.success("webhook added");
      } catch {
        toast.error("failed to add webhook");
      }
    });
  }

  return (
    <Card title="notifications">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input
          variant="sm"
          placeholder="https://hooks.slack.com/services/..."
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          isLoading={pending}
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
            <SettingsItem key={h.id} item={h} apiPath="notifications" label={h.type} />
          ))
        )}
      </div>
    </Card>
  );
}
