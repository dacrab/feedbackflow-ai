"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import SettingsItem, { getNotificationLabel } from "@/components/settings/settings-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    successMessage: "Webhook added",
    errorMessage: "Failed to add webhook",
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
    <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
        </CardTitle>
        <p className="text-sm text-muted-foreground">Alerts for high-severity feedback.</p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            placeholder="Slack webhook URL"
            value={slackUrl}
            onChange={(e) => setSlackUrl(e.target.value)}
            className="h-10"
          />
          <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Webhook"}
          </Button>
        </form>
        <div className="grid gap-3 text-sm border-t border-border/40 pt-4">
          {hooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
              No notifications configured.
            </div>
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
      </CardContent>
    </Card>
  );
}
