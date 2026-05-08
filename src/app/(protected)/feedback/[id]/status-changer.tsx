"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateFeedbackStatus } from "@/lib/actions";
import type { FeedbackStatus } from "@/lib/types";

export default function StatusChanger({ id, initial }: { id: string; initial: FeedbackStatus }) {
  const [status, setStatus] = useState<FeedbackStatus>(initial);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as FeedbackStatus;
    const prev = status;
    setStatus(val);
    startTransition(async () => {
      try {
        await updateFeedbackStatus(id, val);
        toast.success("status updated");
      } catch {
        setStatus(prev);
        toast.error("failed to update");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className="h-7 px-2 rounded border border-border bg-muted/30 text-xs outline-none focus:border-foreground disabled:opacity-50"
    >
      <option value="New">new</option>
      <option value="Acknowledged">acknowledged</option>
      <option value="Actioned">actioned</option>
    </select>
  );
}
