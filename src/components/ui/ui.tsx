import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import type { FeedbackStatus, Sentiment } from "@/lib/types";
import { cn, sentimentColor, sevColor, sevLabel, TONE } from "@/lib/utils";

/** One entry per triage state: the read-only badge and the bulk-action chip
 *  are the same hue, and adding a status means touching exactly one line. */
const statusStyles: Record<Exclude<FeedbackStatus, "New">, { text: string; chip: string }> = {
  Acknowledged: { text: TONE.info, chip: "bg-info/10 text-info hover:bg-info/20" },
  Actioned: { text: TONE.accent, chip: "bg-accent/10 text-accent hover:bg-accent/20" },
};

export const statusChipClass = (status: Exclude<FeedbackStatus, "New">) =>
  statusStyles[status].chip;

type StatusTone = keyof typeof statusToneClass;
export const statusToneClass = {
  ok: TONE.good,
  bad: TONE.danger,
  idle: TONE.muted,
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
      className={cn("font-medium font-mono text-xs tabular-nums", sevColor(score), className)}
      title={sevLabel(score)}
    >
      {score || "·"}
    </span>
  );
}

export function TopicTag({ topic }: { topic: string }) {
  return (
    <span className="rounded border border-border bg-muted/30 px-1.5 py-0.5 text-xs">{topic}</span>
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
        "underline underline-offset-2 transition-colors hover:text-foreground",
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
    <div className="space-y-1 rounded border border-control bg-card px-4 py-3">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex items-end justify-between gap-2">
        <p className="font-medium text-2xl leading-none">{value}</p>
        {delta !== undefined && (
          <span className={`mb-0.5 font-mono text-xs ${delta >= 0 ? TONE.good : TONE.danger}`}>
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
      <h1 className="font-medium text-xl">{title}</h1>
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
      <div className="space-y-4 text-center">
        {eyebrow && <Muted className="text-sm">{eyebrow}</Muted>}
        <h1 className="font-medium text-xl">{title}</h1>
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
  return <p className={cn("text-muted-foreground text-xs", className)}>// {children}</p>;
}

export function Muted({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("text-muted-foreground text-xs", className)} {...props} />;
}

export function TextButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-muted-foreground text-xs transition-colors hover:text-foreground disabled:opacity-50",
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
        "inline-flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
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
    <div className="space-y-1 py-6 text-center">
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
    <div className={cn("space-y-4 rounded border border-control bg-card p-4", className)}>
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
      className={cn("divide-y divide-border rounded border border-control", className)}
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
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

/** Decorative: loading pages own a single live region, so a wall of skeletons
 *  does not announce "loading" once per placeholder. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
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
type ControlSize = keyof typeof btnSize;

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
          "w-full appearance-none rounded border border-control bg-card pr-7 text-foreground text-sm outline-none transition-colors focus:border-foreground disabled:opacity-50",
          btnSize[size],
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground" />
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
