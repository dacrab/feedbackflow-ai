"use client";

import { useState } from "react";
import SettingsItem, { getSourceDescription, getSourceLabel } from "@/components/settings/settings-item";
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
    <div className="rounded border border-border bg-card p-4 space-y-4">
      <p className="text-xs text-muted-foreground">// data sources</p>
      
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          placeholder="owner/repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
        />
        <input
          placeholder="github token (optional)"
          value={ghToken}
          onChange={(e) => setGhToken(e.target.value)}
          type="password"
          className="w-full h-8 px-2 rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={isLoading || !repo}
          className="w-full h-8 rounded border border-border text-sm hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {isLoading ? "adding..." : "add source"}
        </button>
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
              label={getSourceLabel(s.type)}
              description={getSourceDescription(s.config)}
            />
          ))
        )}
      </div>
    </div>
  );
}
