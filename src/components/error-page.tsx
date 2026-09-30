"use client";

import { Button, CenteredState } from "@/components/ui/ui";

export function ErrorPage({
  error,
  reset,
  title = "something went wrong",
  description,
}: {
  error: Error;
  reset: () => void;
  title?: string | undefined;
  description?: string | undefined;
}) {
  return (
    <CenteredState
      className="min-h-[50vh] p-8"
      title={title}
      description={
        description ??
        (process.env.NODE_ENV === "development" ? error.message : "an unexpected error occurred")
      }
      action={<Button onClick={reset}>try again</Button>}
    />
  );
}
