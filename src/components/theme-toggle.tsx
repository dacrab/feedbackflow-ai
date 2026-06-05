"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themeCycle: Record<string, { next: string; icon: typeof IconDeviceDesktop }> = {
  dark: { next: "light", icon: IconMoon },
  light: { next: "system", icon: IconSun },
  system: { next: "dark", icon: IconDeviceDesktop },
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entry = mounted ? themeCycle[theme ?? ""] : undefined;
  const next = entry?.next ?? "dark";
  const Icon = entry?.icon ?? IconDeviceDesktop;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={mounted ? `theme: ${theme}` : "theme"}
      aria-label={mounted ? `switch to ${next} theme` : "toggle theme"}
      suppressHydrationWarning
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
