"use client";

import { ErrorPage } from "@/components/error-page";
import { useReportError } from "@/lib/report-error";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useReportError(error);
  return <ErrorPage error={error} reset={reset} />;
}
