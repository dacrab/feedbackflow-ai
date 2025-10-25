"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function GitHubIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.235-3.222-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.984-.399 3.005-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.912 1.233 3.222 0 4.61-2.805 5.624-5.476 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.293 0 .319.216.694.825.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z"
      />
    </svg>
  );
}

export function GoogleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.9-6.9C36.9 2.04 30.9 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.03 6.23C12.24 13.58 17.57 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.64-.16-3.2-.46-4.7H24v9.08h12.7c-.55 2.97-2.22 5.48-4.72 7.17l7.23 5.61C43.82 37.38 46.5 31.5 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.59 19.45l-8.03-6.23C1.03 15.93 0 19.82 0 24c0 4.12 1.02 8 2.81 11.37l8.17-6.34C10.33 27.03 10 25.55 10 24c0-1.56.33-3.05.59-4.55z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.84l-7.23-5.61c-2.01 1.36-4.58 2.16-8.67 2.16-6.43 0-11.76-4.09-13.41-9.67l-8.17 6.34C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d="M14 6l-6 6 6 6 1.4-1.4L11.8 12l3.6-4.6L14 6z" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d="M10 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6L10 6z" />
    </svg>
  );
}

export function MailIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5L4 8V6l8 5 8-5v2z"
      />
    </svg>
  );
}

export function LockIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm3 8H9V7a3 3 0 016 0v3z"
      />
    </svg>
  );
}

export function UserPlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Head */}
      <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
      {/* Shoulders */}
      <path fill="currentColor" d="M4 22v-1c0-3.866 4.477-7 8-7s8 3.134 8 7v1H4z" />
      {/* Plus */}
      <path fill="currentColor" d="M19 7h-2V5h-2V3h2v2h2v2zm0 0v2h2V7h-2z" />
    </svg>
  );
}

export function KeyIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M14 2a6 6 0 00-5.657 8H2v4h4v4h4v-4h2.343A6 6 0 1014 2zm0 8a2 2 0 110-4 2 2 0 010 4z"
      />
    </svg>
  );
}

export function DownloadIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d="M5 20h14v-2H5v2zm7-18l-5 5h3v6h4V7h3l-5-5z" />
    </svg>
  );
}

export function ChartBarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d="M4 22h16v-2H4v2zM6 18h3V8H6v10zm5 0h3V4h-3v14zm5 0h3v-7h-3v7z" />
    </svg>
  );
}

export function FilterIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" />
    </svg>
  );
}
