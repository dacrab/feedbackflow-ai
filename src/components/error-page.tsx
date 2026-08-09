"use client";

import { CenteredState } from "@/components/ui/ui";

export function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <CenteredState
      className="min-h-[50vh] p-8"
      title="something went wrong"
      description={
        process.env.NODE_ENV === "development" ? error.message : "an unexpected error occurred"
      }
      action={
        <button
          type="button"
          onClick={reset}
          className="h-8 px-4 rounded bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          try again
        </button>
      }
    />
  );
}
