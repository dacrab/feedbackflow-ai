"use client";

import * as Sentry from "@sentry/nextjs";
import { ErrorPage } from "@/components/error-page";

export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  Sentry.captureException(error);
  return <ErrorPage error={error} reset={reset} />;
}
