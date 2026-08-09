import { IconChevronDown } from "@tabler/icons-react";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { cn, sentimentColor } from "@/lib/utils";

export const statusColor: Record<FeedbackStatus, string> = {
  New: "text-muted-foreground",
  Acknowledged: "text-blue-500",
  Actioned: "text-purple-500",
};

export const statusChip: Record<"Acknowledged" | "Actioned", string> = {
  Acknowledged: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  Actioned: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
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
      <Eyebrow>{label}</Eyebrow>
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
      {note && <Muted>{note}</Muted>}
    </div>
  );
}

export function StatusBadge({ status }: { status?: FeedbackStatus | null | undefined }) {
  if (!status || status === "New") return null;
  return <span className={`text-xs ${statusColor[status]}`}>[{status.toLowerCase()}]</span>;
}

export function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="text-xl font-medium">{title}</h1>
    </div>
  );
}

export function CenteredState({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center p-4 font-mono", className)}>
      <div className="text-center space-y-4">
        {eyebrow && <Muted className="text-sm">{eyebrow}</Muted>}
        <h1 className="text-xl font-medium">{title}</h1>
        <Muted className="text-sm">{description}</Muted>
        {action}
      </div>
    </div>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-xs text-muted-foreground", className)}>// {children}</p>;
}

export function Muted({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

export function TextButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-6 space-y-1">
      <Muted className="text-sm">{title}</Muted>
      {hint && <Muted>{hint}</Muted>}
    </div>
  );
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
    <div className={cn("rounded border border-border bg-card p-4 space-y-4", className)}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded border border-border bg-muted/30", className)} />
  );
}

export function Panel({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded border border-border bg-muted/20 px-3 py-2", className)}
      {...props}
    />
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
      className={cn(
        "w-full rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors",
        size,
        className,
      )}
      {...props}
    />
  );
}

const btnVariant = {
  primary: "bg-foreground text-background hover:bg-foreground/90",
  outline: "border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
};
const btnSize = { default: "h-10 px-4", sm: "h-8 px-3", xs: "h-7 px-2 text-xs" };
const selectSize = { default: "h-10 px-3", sm: "h-8 px-2", xs: "h-7 px-2 text-xs" };

function buttonClass(
  variant: keyof typeof btnVariant,
  size: keyof typeof btnSize,
  extra: string,
  className: string,
) {
  return cn(
    "rounded text-sm transition-colors",
    btnVariant[variant],
    btnSize[size],
    extra,
    className,
  );
}

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
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "xs";
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      className={buttonClass(variant, size, "disabled:opacity-50", className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (loadingText ?? "...") : children}
    </button>
  );
}

export function ButtonLink({
  className = "",
  variant = "outline",
  size = "default",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "xs";
}) {
  return (
    <a className={buttonClass(variant, size, "inline-flex items-center", className)} {...props}>
      {children}
    </a>
  );
}

export function Select({
  className = "",
  size = "default",
  children,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: "default" | "sm" | "xs";
}) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded border border-border bg-card text-foreground text-sm outline-none focus:border-foreground transition-colors pr-7 disabled:opacity-50",
          selectSize[size],
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
