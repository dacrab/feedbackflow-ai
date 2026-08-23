"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Input, Muted, TextButton } from "@/components/ui/ui";
import { addSource, deleteSource, updateSource } from "@/lib/actions";
import type { SourceRow } from "@/lib/services/settings-service";
import { confirmDelete, useAction } from "@/lib/use-action";
import { timeAgo } from "@/lib/utils";
import { EnabledStatus, ListItem, ListSection, RowActions } from "./list-item";

function SourceItem({ source }: { source: SourceRow }) {
  const { run, pending } = useAction();

  function onDelete() {
    confirmDelete(`delete ${source.config.repo}?`, () =>
      run(() => deleteSource(source.id), "source deleted"),
    );
  }

  return (
    <ListItem>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{source.config.repo}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <EnabledStatus enabled={source.enabled} />
            <Muted>github</Muted>
            {source.lastChecked && <Muted>· checked {timeAgo(source.lastChecked)}</Muted>}
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
          <TextButton onClick={() => setShowToken(true)}>+ add github token (optional)</TextButton>
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
      <ListSection>
        {sources.length === 0 ? (
          <EmptyState
            title="no sources configured"
            hint="add a github repo above to start ingesting feedback"
          />
        ) : (
          sources.map((s) => <SourceItem key={s.id} source={s} />)
        )}
      </ListSection>
    </Card>
  );
}
