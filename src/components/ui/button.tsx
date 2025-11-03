"use client";

import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[rgba(37,99,235,0.25)] hover:shadow-xl hover:opacity-95",
  secondary:
    "bg-[color-mix(in_oklab,var(--background)_88%,transparent)] text-foreground border border-border/70 hover:border-border hover:bg-[color-mix(in_oklab,var(--accent)_12%,var(--background))]",
  ghost:
    "bg-transparent text-foreground hover:bg-[color-mix(in_oklab,var(--accent)_12%,var(--background))] border border-transparent",
  outline:
    "bg-transparent text-foreground border border-border/70 hover:border-border hover:bg-[color-mix(in_oklab,var(--accent)_8%,var(--background))]",
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-9 px-3.5",
  md: "h-10 px-5",
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
