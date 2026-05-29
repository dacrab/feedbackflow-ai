"use client";

import { ErrorPage } from "@/components/error-page";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} />;
}
