"use client";

import { ChevronLeft, Home, Inbox, LogOut, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  function toggleCollapsed() {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("sidebar-collapsed", String(newValue));
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-2 px-6",
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shrink-0">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && <span className="font-semibold">FeedbackFlow</span>}
      </div>

      <nav className={cn("flex-1 p-2 space-y-1", collapsed ? "px-2" : "p-4")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center p-3" : "gap-3 px-3 py-2",
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

      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-3 px-3 py-2")}>
          <div
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0"
            title={collapsed ? userEmail : undefined}
          >
            {userEmail.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
            </div>
          )}
          <Link
            href="/logout"
            title="Sign out"
            className={cn(
              "rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              collapsed ? "p-2" : "p-1.5",
            )}
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        className={cn(
          "flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        )}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
