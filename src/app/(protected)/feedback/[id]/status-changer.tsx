"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/ui";
import { updateFeedbackStatus } from "@/lib/actions";
import { type FeedbackStatus, isFeedbackStatus } from "@/lib/types";

export default function StatusChanger({ id, initial }: { id: string; initial: FeedbackStatus }) {
  const [status, setStatus] = useState<FeedbackStatus>(initial);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!isFeedbackStatus(val)) return;
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
    <Select value={status} onChange={onChange} disabled={pending} size="xs">
      <option value="New">new</option>
      <option value="Acknowledged">acknowledged</option>
      <option value="Actioned">actioned</option>
    </Select>
  );
}
