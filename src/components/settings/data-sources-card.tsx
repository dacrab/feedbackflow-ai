"use client";

import { Database } from "lucide-react";
import { useState } from "react";
import SettingsItem, {
  getSourceDescription,
  getSourceLabel,
} from "@/components/settings/settings-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    successMessage: "Source added",
    errorMessage: "Failed to add source",
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
    <Card className="border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Data Sources
        </CardTitle>
        <p className="text-sm text-muted-foreground">Connect GitHub repositories or feeds.</p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3">
            <Input
              placeholder="GitHub repo (owner/name)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="h-10"
            />
            <Input
              placeholder="GitHub token (optional)"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              type="password"
              className="h-10"
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Connect Source"}
          </Button>
        </form>
        <div className="grid gap-3 text-sm border-t border-border/40 pt-4">
          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
              No data sources connected.
            </div>
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
      </CardContent>
    </Card>
  );
}
