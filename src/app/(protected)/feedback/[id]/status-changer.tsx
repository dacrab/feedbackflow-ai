"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function StatusChanger({ id, initial }: { id: string; initial: string }) {
  const [status, setStatus] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSaving(true);
    const oldStatus = status;
    setStatus(val);

    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: val }),
      });
      if (!res.ok) throw new Error();
      toast.success("status updated");
    } catch {
      setStatus(oldStatus);
      toast.error("failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={saving}
      className="h-7 px-2 rounded border border-border bg-muted/30 text-xs outline-none focus:border-foreground disabled:opacity-50"
    >
      <option value="New">new</option>
      <option value="Acknowledged">acknowledged</option>
      <option value="Actioned">actioned</option>
    </select>
  );
}
