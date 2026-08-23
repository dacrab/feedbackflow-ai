"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Input, Muted, Select, TextButton } from "@/components/ui/ui";
import { addNotification, deleteNotification, updateNotification } from "@/lib/actions";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import type { HookRow } from "@/lib/services/settings-service";
import { confirmDelete, useAction } from "@/lib/use-action";
import { EnabledStatus, ListItem, ListSection, RowActions } from "./list-item";

function WebhookItem({ hook }: { hook: HookRow }) {
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
    confirmDelete("delete this webhook?", () =>
      run(() => deleteNotification(hook.id), "webhook deleted"),
    );
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
        <Muted>alert on severity ≥</Muted>
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
            <TextButton
              className="text-green-500 hover:text-green-400"
              disabled={pending}
              onClick={() => {
                run(() => updateNotification(hook.id, { minSeverity }), "updated");
                setEditingSeverity(false);
              }}
            >
              save
            </TextButton>
            <TextButton onClick={cancelEdit}>cancel</TextButton>
          </div>
        ) : (
          <TextButton
            className="font-medium text-foreground hover:text-muted-foreground"
            onClick={() => setEditingSeverity(true)}
          >
            {hook.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD}
            <Muted className="ml-1">edit</Muted>
          </TextButton>
        )}
      </div>
    </ListItem>
  );
}

export function NotificationsCard({ hooks }: { hooks: HookRow[] }) {
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
        <Muted>
          alerts sent when feedback severity meets the threshold.{" "}
          <a
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            get webhook ↗
          </a>
        </Muted>
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
