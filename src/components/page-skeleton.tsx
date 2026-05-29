import type { ReactNode } from "react";

export function PageSkeleton({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  return (
    <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap }}>
      {children}
    </div>
  );
}
