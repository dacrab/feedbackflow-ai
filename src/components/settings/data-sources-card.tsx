"use client";

import { useState } from "react";
import SettingsItem from "@/components/settings/settings-item";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiMutation } from "@/hooks";
import type { TransformedSourceRow } from "@/lib/types";

interface DataSourcesCardProps {
  sources: Array<TransformedSourceRow>;
  onRefetch: () => void;
}

export function DataSourcesCard({ sources, onRefetch }: DataSourcesCardProps) {
  const [repo, setRepo] = useState("");
  const [ghToken, setGhToken] = useState("");

  const { mutate: createSource, isLoading } = useApiMutation({
    successMessage: "source added",
    errorMessage: "failed to add source",
    onSuccess: () => {
      setRepo("");
      setGhToken("");
      onRefetch();
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createSource("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "github", repo, token: ghToken || undefined }),
    });
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
        <Input
          variant="sm"
          placeholder="github token (optional)"
          value={ghToken}
          onChange={(e) => setGhToken(e.target.value)}
          type="password"
        />
        <Button
          type="submit"
          size="sm"
          isLoading={isLoading}
          loadingText="adding..."
          disabled={!repo}
          className="w-full"
        >
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
              onUpdate={onRefetch}
              label={s.type}
              description={s.config?.["repo"] ? String(s.config["repo"]) : ""}
            />
          ))
        )}
      </div>
    </Card>
  );
}
