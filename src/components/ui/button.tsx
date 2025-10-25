"use client";

import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-foreground text-background border border-border hover:opacity-90",
  secondary: "bg-card text-foreground border border-border hover:bg-background",
  ghost: "bg-transparent text-foreground hover:bg-background border border-transparent",
  outline: "bg-transparent text-foreground border border-border hover:bg-background",
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-4",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export default Button;
