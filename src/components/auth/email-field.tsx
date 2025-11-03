/**
 * Reusable email input field
 */

import { MailIcon } from "@/components/ui/icons";
import Input from "@/components/ui/input";

interface EmailFieldProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  ariaInvalid?: boolean;
}

export default function EmailField({
  id = "email",
  value,
  onChange,
  placeholder = "you@company.com",
  autoComplete = "email",
  required = true,
  ariaInvalid = false,
}: EmailFieldProps) {
  return (
    <div className="space-y-2 text-sm">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2 font-medium text-muted-foreground"
      >
        <MailIcon className="h-4 w-4" /> Email
      </label>
      <Input
        id={id}
        type="email"
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
      />
    </div>
  );
}
