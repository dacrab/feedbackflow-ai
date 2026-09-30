"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { handleActionError } from "@/lib/utils";

export function useAction() {
  const [pending, startTransition] = useTransition();

  // Resolves with whether it succeeded, so callers can roll back on failure.
  const run = useCallback(
    (fn: () => Promise<unknown>, successMsg?: string, fallbackMsg?: string): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        startTransition(async () => {
          try {
            await fn();
            if (successMsg) toast.success(successMsg);
            resolve(true);
          } catch (e) {
            toast.error(handleActionError(e, fallbackMsg));
            resolve(false);
          }
        });
      }),
    [],
  );

  return { run, pending };
}

export function confirmDelete(message: string, action: () => void) {
  if (window.confirm(message)) action();
}
