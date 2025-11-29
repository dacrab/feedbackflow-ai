"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type CookieStoreLike = {
  set?: (opts: { name: string; value: string; path?: string; expires?: number | Date }) => unknown;
};

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    window.localStorage.setItem("theme", theme);
  } catch {}
  try {
    const cs = (globalThis as { cookieStore?: CookieStoreLike }).cookieStore;
    cs?.set?.({
      name: "theme",
      value: theme,
      path: "/",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
    });
  } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (() => {
      try {
        const v = window.localStorage.getItem("theme");
        return v === "dark" || v === "light" ? (v as Theme) : null;
      } catch {
        return null;
      }
    })();
    const initial =
      stored ||
      (document.documentElement.classList.contains("dark")
        ? "dark"
        : document.documentElement.classList.contains("light")
          ? "light"
          : getSystemTheme());
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
      aria-label="Toggle color theme"
      aria-pressed={theme === "dark"}
    >
      <span
        className="inline-flex h-2 w-2 rounded-full"
        style={{
          background: theme === "dark" ? "#60a5fa" : "#0ea5e9",
          boxShadow:
            theme === "dark" ? "0 0 0 3px rgba(96,165,250,0.25)" : "0 0 0 3px rgba(14,165,233,0.2)",
        }}
      />
      {theme === "dark" ? "Light" : "Dark"} mode
    </button>
  );
}
