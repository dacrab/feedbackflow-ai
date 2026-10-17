"use client";

import { ErrorPage } from "@/components/error-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Renders outside the root layout, so the global stylesheet may not have
  // loaded; set the font inline rather than relying on a Tailwind utility.
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <ErrorPage error={error} reset={reset} />
      </body>
    </html>
  );
}
