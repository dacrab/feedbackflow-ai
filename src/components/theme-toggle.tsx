"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={mounted ? `theme: ${theme}` : "theme"}
      suppressHydrationWarning
    >
      {mounted && theme === "dark" ? (
        <IconMoon className="h-3.5 w-3.5" />
      ) : (
        <IconSun className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
