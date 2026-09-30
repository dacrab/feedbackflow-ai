"use client";

import { ErrorPage } from "@/components/error-page";
import { PROVISIONING_MESSAGE } from "@/lib/constants";
import { useReportError } from "@/lib/report-error";

export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  useReportError(error);

  // A new user can land here before their webhook row exists.
  if (error.message === PROVISIONING_MESSAGE) {
    return (
      <ErrorPage
        error={error}
        reset={reset}
        title="setting up your account"
        description="your account is still being created — this takes a few seconds, then try again"
      />
    );
  }
  return <ErrorPage error={error} reset={reset} />;
}
