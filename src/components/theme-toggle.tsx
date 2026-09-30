"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { IconButton } from "@/components/ui/ui";

const THEME_CYCLE = {
  dark: { next: "light", icon: IconSun },
  light: { next: "system", icon: IconDeviceDesktop },
  system: { next: "dark", icon: IconMoon },
} as const;

type ThemeName = keyof typeof THEME_CYCLE;

function isThemeName(value: string | undefined): value is ThemeName {
  return value !== undefined && value in THEME_CYCLE;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current: ThemeName = isThemeName(theme) ? theme : "system";
  const { next, icon: Icon } = THEME_CYCLE[current];

  return (
    <IconButton
      className="h-7 w-7 rounded border border-border"
      onClick={() => setTheme(next)}
      title={`theme: ${current}`}
      aria-label={`switch to ${next} theme`}
    >
      <Icon className="h-3.5 w-3.5" />
    </IconButton>
  );
}
