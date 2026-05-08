import { IconLoader2 } from "@tabler/icons-react";

type CardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`rounded border border-border bg-card p-4 space-y-4 ${className}`}>
      <p className="text-xs text-muted-foreground">// {title}</p>
      {children}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "default" | "sm";
};

export function Input({ className = "", variant = "default", ...props }: InputProps) {
  const base =
    "w-full rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors";
  const size = variant === "sm" ? "h-8 px-2" : "h-10 px-3";
  return <input className={`${base} ${size} ${className}`} {...props} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "default" | "sm";
  isLoading?: boolean;
  loadingText?: string;
};

export function Button({
  className = "",
  variant = "outline",
  size = "default",
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "rounded text-sm transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    outline: "border border-border hover:bg-muted",
  };
  const sizes = {
    default: "h-10 px-4",
    sm: "h-8 px-3",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (loadingText ?? <IconLoader2 className="h-4 w-4 animate-spin mx-auto" />) : children}
    </button>
  );
}
