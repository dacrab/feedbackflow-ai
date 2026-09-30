"use client";

import { useState } from "react";
import { Card, EmptyState, Input, Muted, TextButton } from "@/components/ui/ui";
import { addSource, deleteSource, updateSource } from "@/lib/actions";
import type { SourceRow } from "@/lib/services/settings-service";
import { confirmDelete, useAction } from "@/lib/use-action";
import { timeAgo } from "@/lib/utils";
import { AddResourceForm, ResourceList, ResourceRow } from "./list-item";

function SourceItem({ source }: { source: SourceRow }) {
  const { run, pending } = useAction();

  return (
    <ResourceRow
      title={source.config.repo}
      meta={
        <>
          <Muted>{source.type}</Muted>
          {source.lastChecked && <Muted>· checked {timeAgo(source.lastChecked)}</Muted>}
        </>
      }
      enabled={source.enabled}
      pending={pending}
      onToggle={() =>
        run(
          () => updateSource(source.id, { enabled: !source.enabled }),
          source.enabled ? "disabled" : "enabled",
        )
      }
      onDelete={() =>
        confirmDelete(`delete ${source.config.repo}?`, () =>
          run(() => deleteSource(source.id), "source deleted"),
        )
      }
    />
  );
}

export function DataSourcesCard({ sources }: { sources: SourceRow[] }) {
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const { run, pending } = useAction();

  function addRepo() {
    run(async () => {
      await addSource(repo, ghToken || undefined);
      setRepo("");
      setGhToken("");
      setShowToken(false);
    }, "source added");
  }

  return (
    <Card title="data sources">
      <AddResourceForm
        id="source-repo"
        label="github repository (owner/repo)"
        placeholder="owner/repo"
        submitLabel="add source"
        value={repo}
        onValueChange={setRepo}
        onSubmit={addRepo}
        pending={pending}
        disabled={!repo}
        hint={
          showToken ? (
            <div className="animate-slide-down space-y-2">
              <label htmlFor="source-token" className="sr-only">
                github personal access token
              </label>
              <Input
                id="source-token"
                placeholder="github token (optional, for private repos)"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                type="password"
                autoComplete="off"
                autoFocus
              />
            </div>
          ) : (
            <TextButton onClick={() => setShowToken(true)}>
              + add github token (optional)
            </TextButton>
          )
        }
      />

      <ResourceList>
        {sources.length === 0 ? (
          <EmptyState
            title="no sources configured"
            hint="add a github repo above to start ingesting feedback"
          />
        ) : (
          sources.map((s) => <SourceItem key={s.id} source={s} />)
        )}
      </ResourceList>
    </Card>
  );
}
