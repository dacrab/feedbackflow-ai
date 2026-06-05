import type { ReactNode } from "react";

export function PageSkeleton({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  return (
    <div className="animate-pulse flex flex-col" style={{ gap }}>
      {children}
    </div>
  );
}
