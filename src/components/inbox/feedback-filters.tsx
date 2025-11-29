"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function FeedbackFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value) params.set(key, value as string);
    }

    router.push(`/inbox?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label htmlFor="q" className="text-xs font-medium">
              Keyword
            </label>
            <Input
              name="q"
              id="q"
              placeholder="Search content..."
              defaultValue={searchParams.get("q") || ""}
            />
          </div>
          <div className="space-y-2 w-full md:w-[150px]">
            <label htmlFor="sentiment" className="text-xs font-medium">
              Sentiment
            </label>
            <select
              name="sentiment"
              id="sentiment"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={searchParams.get("sentiment") || ""}
            >
              <option value="">All</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div className="space-y-2 w-full md:w-[150px]">
            <label htmlFor="status" className="text-xs font-medium">
              Status
            </label>
            <select
              name="status"
              id="status"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={searchParams.get("status") || ""}
            >
              <option value="">All</option>
              <option value="New">New</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Actioned">Actioned</option>
            </select>
          </div>
          <Button type="submit">Apply Filters</Button>
        </form>
      </CardContent>
    </Card>
  );
}
