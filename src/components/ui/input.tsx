"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {};

const Input = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border/70 bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:border-ring/70 focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
