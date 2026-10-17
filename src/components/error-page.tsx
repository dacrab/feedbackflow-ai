"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button, CenteredState } from "@/components/ui/ui";

/** Every error boundary renders through here, so reporting sits with the render
 *  and no boundary can drift into silently swallowing the error it shows. */
export function ErrorPage({
  error,
  reset,
  title = "something went wrong",
  description,
}: {
  error: Error;
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { context: "error-boundary" } });
  }, [error]);

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
