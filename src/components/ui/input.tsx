import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "default" | "sm";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const base =
      "w-full rounded border border-border bg-muted/30 text-sm outline-none focus:border-foreground transition-colors";
    const size = variant === "sm" ? "h-8 px-2" : "h-10 px-3";
    return <input ref={ref} className={`${base} ${size} ${className}`} {...props} />;
  },
);
Input.displayName = "Input";
