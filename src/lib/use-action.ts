"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { handleActionError } from "@/lib/utils";

export function useAction() {
  const [pending, startTransition] = useTransition();

  // Runs `fn` inside a transition, shows toasts, and resolves with whether it
  // succeeded so callers can react (e.g. optimistic rollback / clearing state).
  const run = (
    fn: () => Promise<unknown>,
    successMsg?: string,
    fallbackMsg = "Action failed",
  ): Promise<boolean> =>
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
    });

  return { run, pending };
}

export function confirmDelete(message: string, action: () => void) {
  toast(message, {
    action: {
      label: "delete",
      onClick: action,
    },
  });
}
