"use client";

import { ErrorPage } from "@/components/error-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Renders outside the root layout, so it sets its own font.
  return (
    <html lang="en">
      <body className="font-mono">
        <ErrorPage error={error} reset={reset} />
      </body>
    </html>
  );
}
