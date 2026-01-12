import { IconLoader2 } from "@tabler/icons-react";
import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "default" | "sm";
  isLoading?: boolean;
  loadingText?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "outline",
      size = "default",
      isLoading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
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
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          loadingText ? (
            loadingText
          ) : (
            <IconLoader2 className="h-4 w-4 animate-spin mx-auto" />
          )
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
