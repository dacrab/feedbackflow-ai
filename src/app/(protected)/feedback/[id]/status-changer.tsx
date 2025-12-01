"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

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

  async function onValueChange(val: string) {
    setSaving(true);
    // Optimistic update
    const oldStatus = status;
    setStatus(val);

    try {
      const res = await fetch(`/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: val }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      toast.success("Status updated");
    } catch {
      setStatus(oldStatus);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={onValueChange} disabled={saving}>
        <SelectTrigger className={cn("w-[140px]", compact && "h-8 text-xs")}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Acknowledged">Acknowledged</SelectItem>
          <SelectItem value="Actioned">Actioned</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
