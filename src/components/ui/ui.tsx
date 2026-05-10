import { IconChevronDown, IconLoader2 } from "@tabler/icons-react";

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
    <div className={`rounded border border-border bg-card p-4 space-y-4 ${className}`}>
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
      aria-invalid={props["aria-invalid"] || undefined}
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
      {isLoading
        ? (loadingText ?? <IconLoader2 className="h-4 w-4 animate-spin mx-auto" />)
        : children}
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
