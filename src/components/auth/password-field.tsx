/**
 * Reusable password input field with show/hide toggle and strength indicator
 */

import { useMemo, useState } from "react";
import { LockIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { calculatePasswordScore } from "@/lib/utils/password";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  showStrengthIndicator?: boolean;
  required?: boolean;
  minLength?: number;
  ariaInvalid?: boolean;
  showIcon?: boolean;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = "Choose a strong password",
  autoComplete = "new-password",
  showStrengthIndicator = false,
  required = true,
  minLength = 8,
  ariaInvalid = false,
  showIcon = false,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const score = useMemo(() => calculatePasswordScore(value), [value]);

  const strengthColors: Record<number, string> = {
    1: "bg-red-400 w-1/5",
    2: "bg-orange-400 w-2/5",
    3: "bg-yellow-400 w-3/5",
    4: "bg-lime-500 w-4/5",
    5: "bg-emerald-500 w-full",
  };

  return (
    <div className="space-y-2 text-sm">
      <label
        htmlFor={id}
        className={
          showIcon
            ? "inline-flex items-center gap-2 font-medium text-muted-foreground"
            : "font-medium text-muted-foreground"
        }
      >
        {showIcon && <LockIcon className="h-4 w-4" />} {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={ariaInvalid}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-muted-foreground underline"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {showStrengthIndicator && value.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,transparent)] p-3">
          <div className="h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--accent)_8%,var(--background))]">
            <div
              className={`h-1.5 rounded-full transition-all ${
                strengthColors[score] || strengthColors[1]
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters with upper, lower, number, and symbol for best security.
          </p>
        </div>
      )}
    </div>
  );
}
