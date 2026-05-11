import type { ReactNode } from "react";

export function PageSkeleton({ children, gap = "4" }: { children: ReactNode; gap?: string }) {
  return <div className={`space-y-${gap} animate-pulse`}>{children}</div>;
}
