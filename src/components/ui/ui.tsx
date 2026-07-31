import { IconChevronDown } from "@tabler/icons-react";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { sentimentColor } from "@/lib/utils";

const statusColor: Record<FeedbackStatus, string> = {
  New: "text-muted-foreground",
  Acknowledged: "text-blue-500",
  Actioned: "text-purple-500",
};

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment | null | undefined }) {
  if (!sentiment) return null;
  return <span className={`text-xs ${sentimentColor(sentiment)}`}>{sentiment}</span>;
}

export function MetricCard({
  label,
  value,
  delta,
  note,
}: {
  label: string;
  value: string | number;
  delta?: number;
  note?: string;
}) {
  return (
    <div className="rounded border border-border bg-card px-4 py-3 space-y-1">
      <p className="text-xs text-muted-foreground">// {label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-medium leading-none">{value}</p>
        {delta !== undefined && (
          <span
            className={`text-xs font-mono mb-0.5 ${delta >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {delta >= 0 ? "↑" : "↓"}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status?: FeedbackStatus | null | undefined }) {
  if (!status || status === "New") return null;
  return <span className={`text-xs ${statusColor[status]}`}>[{status.toLowerCase()}]</span>;
}

export function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded border border-border bg-card p-4 space-y-4 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">// {title}</p>
      {children}
    </div>
  );
}

export function Input({
  className = "",
  variant = "default",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { variant?: "default" | "sm" }) {
  const size = variant === "sm" ? "h-8 px-2" : "h-10 px-3";
  return (
    <input
      className={`w-full rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors ${size} ${className}`}
      {...props}
    />
  );
}

const btnVariant = {
  primary: "bg-foreground text-background hover:bg-foreground/90",
  outline: "border border-border hover:bg-muted",
};
const btnSize = { default: "h-10 px-4", sm: "h-8 px-3" };

export function Button({
  className = "",
  variant = "outline",
  size = "default",
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "default" | "sm";
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      className={`rounded text-sm transition-colors disabled:opacity-50 ${btnVariant[variant]} ${btnSize[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (loadingText ?? "...") : children}
    </button>
  );
}

const selectSize = { default: "h-10 px-3", sm: "h-8 px-2", xs: "h-7 px-2 text-xs" };

export function Select({
  className = "",
  size = "default",
  children,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: "default" | "sm" | "xs";
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        className={`w-full appearance-none rounded border border-border bg-card text-foreground text-sm outline-none focus:border-foreground transition-colors pr-7 disabled:opacity-50 ${selectSize[size]}`}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
