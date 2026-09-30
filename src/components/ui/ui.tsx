import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { cn, sentimentColor, sevColor, sevLabel } from "@/lib/utils";

/** One entry per triage state: the read-only badge and the bulk-action chip
 *  are the same hue, and adding a status means touching exactly one line. */
const statusStyles: Record<Exclude<FeedbackStatus, "New">, { text: string; chip: string }> = {
  Acknowledged: { text: "text-info", chip: "bg-info/10 text-info hover:bg-info/20" },
  Actioned: { text: "text-accent", chip: "bg-accent/10 text-accent hover:bg-accent/20" },
};

export const statusChipClass = (status: Exclude<FeedbackStatus, "New">) =>
  statusStyles[status].chip;

export type StatusTone = keyof typeof statusToneClass;
export const statusToneClass = {
  ok: "text-good",
  bad: "text-danger",
  idle: "text-muted-foreground",
} as const;

export function StatusDot({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-xs", statusToneClass[tone], className)}>{children}</span>;
}

export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment?: Sentiment | null | undefined;
  className?: string;
}) {
  if (!sentiment) return null;
  return <span className={cn("text-xs", sentimentColor(sentiment), className)}>{sentiment}</span>;
}

export function StatusBadge({ status }: { status?: FeedbackStatus | null | undefined }) {
  if (!status || status === "New") return null;
  return <span className={`text-xs ${statusStyles[status].text}`}>[{status.toLowerCase()}]</span>;
}

export function SeverityChip({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn("text-xs font-mono font-medium tabular-nums", sevColor(score), className)}
      title={sevLabel(score)}
    >
      {score || "·"}
    </span>
  );
}

export function TopicTag({ topic }: { topic: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded border border-border bg-muted/30 text-xs">{topic}</span>
  );
}

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "underline underline-offset-2 hover:text-foreground transition-colors",
        className,
      )}
    >
      {children}
    </a>
  );
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
    <div className="rounded border border-control bg-card px-4 py-3 space-y-1">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-medium leading-none">{value}</p>
        {delta !== undefined && (
          <span className={`text-xs font-mono mb-0.5 ${delta >= 0 ? "text-good" : "text-danger"}`}>
            {delta >= 0 ? "↑" : "↓"}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      {note && <Muted>{note}</Muted>}
    </div>
  );
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
    <div className={cn("flex min-h-screen items-center justify-center p-4", className)}>
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

export function IconButton({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </button>
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
    <div className={cn("rounded border border-control bg-card p-4 space-y-4", className)}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  );
}

export function Panel({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded border border-control bg-muted/20 px-3 py-2", className)}
      {...props}
    />
  );
}

/** Surface for a stack of rows separated by hairlines. */
export function Rows({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded border border-control divide-y divide-border", className)}
      {...props}
    />
  );
}

/** A dt/dd pair. `row` lays the label and value out side by side. */
export function KeyValue({
  label,
  layout = "stack",
  className = "",
  children,
}: {
  label: string;
  layout?: "stack" | "row";
  className?: string;
  children: React.ReactNode;
}) {
  if (layout === "row") {
    return (
      <div className={cn("flex justify-between gap-2", className)}>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="truncate">{children}</dd>
      </div>
    );
  }
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn("animate-pulse rounded border border-control bg-muted/30", className)}
    />
  );
}

const btnVariant = {
  primary: "bg-foreground text-background hover:bg-foreground/90",
  outline: "border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
};
const btnSize = { sm: "h-8 px-2 text-sm", xs: "h-7 px-2 text-xs", lg: "px-6 py-3 text-sm" };
export type ControlSize = keyof typeof btnSize;

function buttonClass(
  variant: keyof typeof btnVariant,
  size: ControlSize,
  extra: string,
  className: string,
) {
  return cn("rounded transition-colors", btnVariant[variant], btnSize[size], extra, className);
}

export function Button({
  className = "",
  variant = "outline",
  size = "sm",
  // A Button inside a form must not submit it by accident.
  type = "button",
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariant;
  size?: ControlSize;
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      type={type}
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
  size = "sm",
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: keyof typeof btnVariant;
  size?: ControlSize;
}) {
  return (
    <Link className={buttonClass(variant, size, "inline-flex items-center", className)} {...props}>
      {children}
    </Link>
  );
}

export function Select({
  className = "",
  size = "sm",
  children,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: ControlSize }) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded border border-control bg-card text-foreground text-sm outline-none focus:border-foreground transition-colors pr-7 disabled:opacity-50",
          btnSize[size],
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

const fieldBase = "w-full rounded border border-control bg-muted/30 text-sm transition-colors";

export function Input({
  className = "",
  size = "sm",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: ControlSize }) {
  return (
    <input
      className={cn(fieldBase, btnSize[size], "outline-none focus:border-foreground", className)}
      {...props}
    />
  );
}

export const maskedFieldClass = cn(
  fieldBase,
  btnSize.sm,
  "text-left text-muted-foreground focus-within:border-foreground hover:border-foreground",
);
