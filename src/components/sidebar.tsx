"use client";

import {
  IconChevronLeft,
  IconHome,
  IconInbox,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: IconHome },
  { href: "/inbox", label: "inbox", icon: IconInbox },
  { href: "/settings", label: "settings", icon: IconSettings },
];

export function Sidebar({
  userEmail,
  initialCollapsed = false,
}: {
  userEmail: string;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-52",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-2 px-4",
        )}
      >
        <Logo />
        {!collapsed && (
          <span className="text-sm transition-opacity duration-150 opacity-100">feedbackflow</span>
        )}
      </div>

      <nav className="flex-1 py-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                "flex items-center rounded text-sm transition-colors mb-1",
                collapsed ? "justify-center p-2" : "gap-2 px-2 py-1.5",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-2 px-2 py-1")}>
          <div
            className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs shrink-0"
            title={collapsed ? userEmail : undefined}
          >
            {userEmail.charAt(0).toLowerCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-150 opacity-100">
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
          <Link
            href="/logout"
            title="logout"
            aria-label="logout"
            className={cn(
              "rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              collapsed ? "p-1.5" : "p-1",
            )}
          >
            <IconLogout className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          document.cookie = `sidebar-collapsed=${next};path=/;max-age=31536000`;
        }}
        className="flex items-center justify-center h-8 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title={collapsed ? "expand" : "collapse"}
        aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
        aria-expanded={!collapsed}
      >
        <IconChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
