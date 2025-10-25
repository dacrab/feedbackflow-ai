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
        "w-full rounded-md border border-border bg-input text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring px-3 py-2",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
