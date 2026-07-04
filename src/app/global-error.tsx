"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorPage } from "@/components/error-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground p-8 font-mono">
        <ErrorPage error={error} reset={reset} />
      </body>
    </html>
  );
}
