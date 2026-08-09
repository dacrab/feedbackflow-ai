"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { handleActionError } from "@/lib/utils";

export function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>, successMsg?: string, fallbackMsg = "Action failed") => {
    startTransition(async () => {
      try {
        await fn();
        if (successMsg) toast.success(successMsg);
      } catch (e) {
        toast.error(handleActionError(e, fallbackMsg));
      }
    });
  };
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
