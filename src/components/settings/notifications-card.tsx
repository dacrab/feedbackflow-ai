"use client";

import { useState } from "react";
import { Card, EmptyState, ExternalLink, Muted, Select, TextButton } from "@/components/ui/ui";
import { addNotification, deleteNotification, updateNotification } from "@/lib/actions";
import { HIGH_SEVERITY_THRESHOLD, MAX_SEVERITY } from "@/lib/constants";
import type { HookRow } from "@/lib/services/settings-service";
import { confirmDelete, useAction } from "@/lib/use-action";
import { AddResourceForm, ResourceList, ResourceRow } from "./list-item";

const SLACK_WEBHOOK_DOCS = "https://api.slack.com/messaging/webhooks";
const SEVERITIES = Array.from({ length: MAX_SEVERITY }, (_, i) => i + 1);

function WebhookItem({ hook }: { hook: HookRow }) {
  const threshold = hook.config.minSeverity ?? HIGH_SEVERITY_THRESHOLD;
  const [editing, setEditing] = useState(false);
  const [minSeverity, setMinSeverity] = useState(threshold);
  const { run, pending } = useAction();

  function saveSeverity() {
    run(() => updateNotification(hook.id, { minSeverity }), "updated").then((ok) => {
      if (ok) setEditing(false);
    });
  }

  return (
    <ResourceRow
      title="slack webhook"
      enabled={hook.enabled}
      pending={pending}
      onToggle={() =>
        run(
          () => updateNotification(hook.id, { enabled: !hook.enabled }),
          hook.enabled ? "disabled" : "enabled",
        )
      }
      onDelete={() =>
        confirmDelete("delete this webhook?", () =>
          run(() => deleteNotification(hook.id), "webhook deleted"),
        )
      }
    >
      <div className="flex items-center gap-2">
        <Muted>alert on severity ≥</Muted>
        {editing ? (
          <div className="animate-slide-down flex items-center gap-2">
            <Select
              aria-label="minimum severity"
              size="xs"
              value={String(minSeverity)}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="w-16"
            >
              {SEVERITIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <TextButton
              className="text-good hover:text-good/80"
              disabled={pending}
              onClick={saveSeverity}
            >
              save
            </TextButton>
            <TextButton
              onClick={() => {
                setMinSeverity(threshold);
                setEditing(false);
              }}
            >
              cancel
            </TextButton>
          </div>
        ) : (
          <TextButton
            className="text-foreground hover:text-muted-foreground font-medium"
            onClick={() => setEditing(true)}
          >
            {threshold}
            <Muted className="ml-1">edit</Muted>
          </TextButton>
        )}
      </div>
    </ResourceRow>
  );
}

export function NotificationsCard({ hooks }: { hooks: HookRow[] }) {
  const [slackUrl, setSlackUrl] = useState("");
  const { run, pending } = useAction();

  return (
    <Card title="notifications">
      <AddResourceForm
        id="hook-url"
        label="slack webhook url"
        placeholder="https://hooks.slack.com/services/..."
        submitLabel="add webhook"
        value={slackUrl}
        onValueChange={setSlackUrl}
        onSubmit={() =>
          run(async () => {
            await addNotification(slackUrl);
            setSlackUrl("");
          }, "webhook added")
        }
        pending={pending}
        disabled={!slackUrl}
        inputType="url"
        hint={
          <Muted>
            alerts sent when feedback severity meets the threshold.{" "}
            <ExternalLink href={SLACK_WEBHOOK_DOCS}>get webhook ↗</ExternalLink>
          </Muted>
        }
      />

      <ResourceList>
        {hooks.length === 0 ? (
          <EmptyState
            title="no webhooks configured"
            hint="add a slack webhook to get notified on high-severity feedback"
          />
        ) : (
          hooks.map((h) => <WebhookItem key={h.id} hook={h} />)
        )}
      </ResourceList>
    </Card>
  );
}
