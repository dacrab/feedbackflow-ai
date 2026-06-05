"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Select } from "@/components/ui/ui";
import type { SlackNotificationConfig } from "@/db/schema";
import { addNotification, deleteNotification, updateNotification } from "@/lib/actions";
import { useAction } from "@/lib/use-action";

type NotificationRow = {
  id: string;
  type: "slack";
  config: SlackNotificationConfig;
  enabled: boolean;
};

function WebhookItem({ hook }: { hook: NotificationRow }) {
  const [editingSeverity, setEditingSeverity] = useState(false);
  const [minSeverity, setMinSeverity] = useState(hook.config.minSeverity ?? 4);
  const { act, pending } = useAction();

  useEffect(() => {
    if (!editingSeverity) setMinSeverity(hook.config.minSeverity ?? 4);
  }, [hook.config.minSeverity, editingSeverity]);

  function onDelete() {
    toast("delete this webhook?", {
      action: {
        label: "delete",
        onClick: () => act(() => deleteNotification(hook.id), "webhook deleted"),
      },
    });
  }

  return (
    <div className="rounded border border-border bg-muted/20 px-3 py-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">slack webhook</p>
          <span className={`text-xs ${hook.enabled ? "text-green-500" : "text-muted-foreground"}`}>
            {hook.enabled ? "● enabled" : "○ disabled"}
          </span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              act(
                () => updateNotification(hook.id, { enabled: !hook.enabled }),
                hook.enabled ? "disabled" : "enabled",
              )
            }
            className="h-7 px-2 rounded border border-border text-xs hover:bg-muted transition-colors disabled:opacity-50"
          >
            {hook.enabled ? "disable" : "enable"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            delete
          </button>
        </div>
      </div>

      {/* Min severity config */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">alert on severity ≥</span>
        {editingSeverity ? (
          <div className="flex items-center gap-2 animate-slide-down">
            <Select
              size="xs"
              value={String(minSeverity)}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="w-16"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                act(() => updateNotification(hook.id, { minSeverity }), "updated");
                setEditingSeverity(false);
              }}
              className="text-xs text-green-500 hover:text-green-400 transition-colors disabled:opacity-50"
            >
              save
            </button>
            <button
              type="button"
              onClick={() => setEditingSeverity(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingSeverity(true)}
            className="text-xs font-medium hover:text-muted-foreground transition-colors"
          >
            {hook.config.minSeverity ?? 4}
            <span className="text-muted-foreground ml-1">edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationsCard({ hooks }: { hooks: NotificationRow[] }) {
  const [slackUrl, setSlackUrl] = useState("");
  const { act, pending } = useAction();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    act(async () => {
      await addNotification(slackUrl);
      setSlackUrl("");
    }, "webhook added");
  }

  return (
    <Card title="notifications">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input
          variant="sm"
          placeholder="https://hooks.slack.com/services/..."
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
          type="url"
        />
        <p className="text-xs text-muted-foreground">
          alerts sent when feedback severity meets the threshold.{" "}
          <a
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            get webhook ↗
          </a>
        </p>
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

      <div className="space-y-2 border-t border-border pt-3">
        {hooks.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <p className="text-sm text-muted-foreground">no webhooks configured</p>
            <p className="text-xs text-muted-foreground">
              add a slack webhook to get notified on high-severity feedback
            </p>
          </div>
        ) : (
          hooks.map((h) => <WebhookItem key={h.id} hook={h} />)
        )}
      </div>
    </Card>
  );
}
