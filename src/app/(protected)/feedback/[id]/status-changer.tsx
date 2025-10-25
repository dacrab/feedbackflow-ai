"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function StatusChanger({ id, initial }: { id: string; initial: string }) {
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
    <label className="inline-flex items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        value={status}
        onChange={onChange}
        disabled={saving}
      >
        <option value="New">New</option>
        <option value="Acknowledged">Acknowledged</option>
        <option value="Actioned">Actioned</option>
      </select>
      {saving && <span className="text-xs text-zinc-500">Saving…</span>}
    </label>
  );
}
