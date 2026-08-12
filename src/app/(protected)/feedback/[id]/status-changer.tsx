"use client";

import { useState } from "react";
import { Select } from "@/components/ui/ui";
import { updateFeedbackStatus } from "@/lib/actions";
import { FEEDBACK_STATUS_OPTIONS, type FeedbackStatus, isFeedbackStatus } from "@/lib/types";
import { useAction } from "@/lib/use-action";

export default function StatusChanger({ id, initial }: { id: string; initial: FeedbackStatus }) {
  const [status, setStatus] = useState<FeedbackStatus>(initial);
  const { run, pending } = useAction();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!isFeedbackStatus(val)) return;
    const prev = status;
    setStatus(val);
    run(() => updateFeedbackStatus(id, val), "status updated", "failed to update").then((ok) => {
      if (!ok) setStatus(prev);
    });
  }

  return (
    <Select value={status} onChange={onChange} disabled={pending} size="xs">
      {FEEDBACK_STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.toLowerCase()}
        </option>
      ))}
    </Select>
  );
}
