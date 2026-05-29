"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export function useAction() {
  const [pending, startTransition] = useTransition();

  function act(fn: () => Promise<void>, successMsg?: string) {
    startTransition(async () => {
      try {
        await fn();
        if (successMsg) toast.success(successMsg);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "failed");
      }
    });
  }

  return { act, pending };
}
