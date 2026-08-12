import Link from "next/link";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="4" className="fill-foreground" />
      <path
        d="M9 11l6 5-6 5"
        className="stroke-background"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="17" y="19" width="6" height="2.5" rx="1" className="fill-background" />
    </svg>
  );
}

export function Brand({
  href,
  className = "",
  logoClassName,
}: {
  href?: string;
  className?: string;
  logoClassName?: string;
}) {
  const inner = (
    <>
      <Logo className={logoClassName ?? "h-7 w-7"} />
      <span>feedbackflow</span>
    </>
  );
  const innerClass = `flex items-center gap-2 text-sm ${className}`;
  return href ? (
    <Link href={href} className={innerClass}>
      {inner}
    </Link>
  ) : (
    <div className={innerClass}>{inner}</div>
  );
}
