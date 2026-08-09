"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, Input, Select } from "@/components/ui/ui";
import type { SlackNotificationConfig } from "@/db/schema";
import { addNotification, deleteNotification, updateNotification } from "@/lib/actions";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import { useAction } from "@/lib/use-action";
import { EmptyState, EnabledStatus, ListItem, ListSection, RowActions } from "./list-item";

type NotificationRow = {
  id: string;
  type: "slack";
  config: SlackNotificationConfig;
  enabled: boolean;
};

function WebhookItem({ hook }: { hook: NotificationRow }) {
  const [editingSeverity, setEditingSeverity] = useState(false);
  const [minSeverity, setMinSeverity] = useState(
    hook.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD,
  );
  const { run, pending } = useAction();

  function cancelEdit() {
    setMinSeverity(hook.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD);
    setEditingSeverity(false);
  }

  function onDelete() {
    toast("delete this webhook?", {
      action: {
        label: "delete",
        onClick: () => run(() => deleteNotification(hook.id), "webhook deleted"),
      },
    });
  }

  return (
    <ListItem>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">slack webhook</p>
          <EnabledStatus enabled={hook.enabled} />
        </div>
        <RowActions
          enabled={hook.enabled}
          pending={pending}
          onToggle={() =>
            run(
              () => updateNotification(hook.id, { enabled: !hook.enabled }),
              hook.enabled ? "disabled" : "enabled",
            )
          }
          onDelete={onDelete}
        />
      </div>

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
              {Array.from({ length: MAX_SEVERITY }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                run(() => updateNotification(hook.id, { minSeverity }), "updated");
                setEditingSeverity(false);
              }}
              className="text-xs text-green-500 hover:text-green-400 transition-colors disabled:opacity-50"
            >
              save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
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
            {hook.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD}
            <span className="text-muted-foreground ml-1">edit</span>
          </button>
        )}
      </div>
    </ListItem>
  );
}

export function NotificationsCard({ hooks }: { hooks: NotificationRow[] }) {
  const [slackUrl, setSlackUrl] = useState("");
  const { run, pending } = useAction();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
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

      <ListSection>
        {hooks.length === 0 ? (
          <EmptyState
            title="no webhooks configured"
            hint="add a slack webhook to get notified on high-severity feedback"
          />
        ) : (
          hooks.map((h) => <WebhookItem key={h.id} hook={h} />)
        )}
      </ListSection>
    </Card>
  );
}
