type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "default" | "sm";
};

export function Input({ className = "", variant = "default", ...props }: InputProps) {
  const base =
    "w-full rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors";
  const size = variant === "sm" ? "h-8 px-2" : "h-10 px-3";
  return <input className={`${base} ${size} ${className}`} {...props} />;
}
