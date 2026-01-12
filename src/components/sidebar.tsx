"use client";

import { ChevronLeft, Home, Inbox, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: Home },
  { href: "/inbox", label: "inbox", icon: Inbox },
  { href: "/settings", label: "settings", icon: Settings },
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
        {!collapsed && <span className="text-sm">feedbackflow</span>}
      </div>

      <nav className={cn("flex-1 py-2", collapsed ? "px-2" : "px-2")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
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

      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-2")}>
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-2 px-2 py-1")}>
          <div
            className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs shrink-0"
            title={collapsed ? userEmail : undefined}
          >
            {userEmail.charAt(0).toLowerCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
          <Link
            href="/logout"
            title="logout"
            className={cn(
              "rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              collapsed ? "p-1.5" : "p-1",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex items-center justify-center h-8 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title={collapsed ? "expand" : "collapse"}
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
