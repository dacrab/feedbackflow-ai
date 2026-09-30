"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Every error boundary reports through here so none can drift into silently
 *  swallowing the error it was mounted to show. */
export function useReportError(error: Error) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
}
