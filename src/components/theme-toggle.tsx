"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

const themeCycle: Record<string, { next: string; icon: typeof IconDeviceDesktop }> = {
  dark: { next: "light", icon: IconMoon },
  light: { next: "system", icon: IconSun },
  system: { next: "dark", icon: IconDeviceDesktop },
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const entry = theme ? themeCycle[theme] : undefined;
  const next = entry?.next ?? "dark";
  const Icon = entry?.icon ?? IconDeviceDesktop;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      suppressHydrationWarning
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
