"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsList } from "@/components/settings/settings-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiMutation } from "@/hooks";
import type { TransformedRow } from "@/lib/types";

interface NotificationsCardProps {
  hooks: Array<TransformedRow>;
}

export function NotificationsCard({ hooks }: NotificationsCardProps) {
  const router = useRouter();
  const [slackUrl, setSlackUrl] = useState("");

  const { mutate: createNotification, isLoading } = useApiMutation({
    successMessage: "webhook added",
    errorMessage: "failed to add webhook",
    onSuccess: () => {
      setSlackUrl("");
      router.refresh();
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
        <SettingsList
          items={hooks}
          apiPath="notifications"
          getLabel={(h) => h.type}
        />
      </div>
    </Card>
  );
}
