"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function StatusChanger({
  id,
  initial,
  compact = false,
}: {
  id: string;
  initial: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSaving(true);
    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: val }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus(val);
      toast.success("Status updated");
    } catch (_) {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <select
        className={`rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_90%,transparent)] text-foreground shadow-sm focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${compact ? "px-3 py-1 text-xs" : "px-3.5 py-2 text-sm"}`}
        value={status}
        onChange={onChange}
        disabled={saving}
      >
        <option value="New">New</option>
        <option value="Acknowledged">Acknowledged</option>
        <option value="Actioned">Actioned</option>
      </select>
      {saving && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Saving…</span>}
    </label>
  );
}
