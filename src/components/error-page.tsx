"use client";

import { Button, CenteredState } from "@/components/ui/ui";

export function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <CenteredState
      className="min-h-[50vh] p-8"
      title="something went wrong"
      description={
        process.env.NODE_ENV === "development" ? error.message : "an unexpected error occurred"
      }
      action={
        <Button size="sm" variant="outline" onClick={reset}>
          try again
        </Button>
      }
    />
  );
}
