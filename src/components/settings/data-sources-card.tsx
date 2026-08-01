"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, Input } from "@/components/ui/ui";
import type { GitHubSourceConfig } from "@/db/schema";
import { addSource, deleteSource, updateSource } from "@/lib/actions";
import { useAction } from "@/lib/use-action";
import { timeAgo } from "@/lib/utils";
import { EmptyState, EnabledStatus, ListItem, RowActions } from "./list-item";

type SourceRow = {
  id: string;
  type: "github";
  config: GitHubSourceConfig;
  enabled: boolean;
  lastChecked: Date | null;
  createdAt: Date;
};

function SourceItem({ source }: { source: SourceRow }) {
  const { run, pending } = useAction();

  function onDelete() {
    toast(`delete ${source.config.repo}?`, {
      action: {
        label: "delete",
        onClick: () => run(() => deleteSource(source.id), "source deleted"),
      },
    });
  }

  return (
    <ListItem>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{source.config.repo}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <EnabledStatus enabled={source.enabled} />
            <span className="text-xs text-muted-foreground">github</span>
            {source.lastChecked && (
              <span className="text-xs text-muted-foreground">
                · checked {timeAgo(source.lastChecked)}
              </span>
            )}
          </div>
        </div>
        <RowActions
          enabled={source.enabled}
          pending={pending}
          onToggle={() =>
            run(
              () => updateSource(source.id, { enabled: !source.enabled }),
              source.enabled ? "disabled" : "enabled",
            )
          }
          onDelete={onDelete}
        />
      </div>
    </ListItem>
  );
}

export function DataSourcesCard({ sources }: { sources: SourceRow[] }) {
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { run, pending } = useAction();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      await addSource(repo, ghToken || undefined);
      setRepo("");
      setGhToken("");
      setShowToken(false);
    }, "source added");
  }

  return (
    <Card title="data sources">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input
          variant="sm"
          placeholder="owner/repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
        {showToken ? (
          <div className="animate-slide-down">
            <Input
              variant="sm"
              placeholder="github token (optional, for private repos)"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              type="password"
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowToken(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + add github token (optional)
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          isLoading={pending}
          loadingText="adding..."
          disabled={!repo}
          className="w-full"
        >
          add source
        </Button>
      </form>
      <div className="space-y-2 border-t border-border pt-3">
        {sources.length === 0 ? (
          <EmptyState
            title="no sources configured"
            hint="add a github repo above to start ingesting feedback"
          />
        ) : (
          sources.map((s) => <SourceItem key={s.id} source={s} />)
        )}
      </div>
    </Card>
  );
}
