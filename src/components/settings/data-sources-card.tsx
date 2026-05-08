"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useState } from "react";
import SettingsItem from "@/components/settings/settings-item";
import { Button, Card, Input } from "@/components/ui/ui";
import { addSource } from "@/lib/actions";
import type { TransformedRow } from "@/lib/types";

export function DataSourcesCard({ sources }: { sources: TransformedRow[] }) {
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addSource(repo, ghToken || undefined);
        setRepo("");
        setGhToken("");
        toast.success("source added");
      } catch {
        toast.error("failed to add source");
      }
    });
  }

  return (
    <Card title="data sources">
      <form onSubmit={onSubmit} className="space-y-2">
        <Input variant="sm" placeholder="owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
        <Input variant="sm" placeholder="github token (optional)" value={ghToken} onChange={(e) => setGhToken(e.target.value)} type="password" />
        <Button type="submit" size="sm" isLoading={pending} loadingText="adding..." disabled={!repo} className="w-full">
          add source
        </Button>
      </form>
      <div className="space-y-2 border-t border-border pt-4">
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">no sources</p>
        ) : (
          sources.map((s) => (
            <SettingsItem
              key={s.id}
              item={s}
              apiPath="sources"
              label={s.type}
              {...(s.config?.["repo"] ? { description: String(s.config["repo"]) } : {})}
            />
          ))
        )}
      </div>
    </Card>
  );
}
