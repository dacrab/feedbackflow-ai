/**
 * Reusable password input field with optional strength indicator
 */

import { LockIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";
import { calculatePasswordScore } from "@/lib/utils/auth";

interface PasswordFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  showIcon?: boolean;
  required?: boolean;
  ariaInvalid?: boolean;
}

const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];

export default function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
  showStrength = false,
  showIcon = false,
  required = true,
  ariaInvalid = false,
}: PasswordFieldProps) {
  const score = showStrength ? calculatePasswordScore(value) : 0;

  return (
    <div className="space-y-2 text-sm">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2 font-medium text-muted-foreground"
      >
        {showIcon && <LockIcon className="h-4 w-4" />} {label}
      </label>
      <Input
        id={id}
        type="password"
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
      />
      {showStrength && value.length > 0 && (
        <div className="info-box space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Password strength</span>
            <span className="font-medium text-foreground">{strengthLabels[score]}</span>
          </div>
          <div className="strength-bar-track">
            <div
              className={`h-full rounded-full transition-all ${strengthColors[score]}`}
              style={{ width: `${((score + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
