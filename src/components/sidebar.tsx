"use client";

import { IconChevronLeft, IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/logo";
import { isNavItemActive, NAV_ITEMS } from "@/components/nav-items";
import { IconButton, Muted } from "@/components/ui/ui";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** A year: the collapse preference should survive a long weekend, not a decade. */
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function Sidebar({
  userEmail,
  initialCollapsed = false,
}: {
  userEmail: string;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not widely supported
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next};path=/;max-age=${COOKIE_MAX_AGE_SEC}`;
  }

  return (
    <aside
      className={cn(
        "border-border bg-background hidden flex-col border-r transition-all duration-200 md:flex",
        collapsed ? "w-14" : "w-52",
      )}
    >
      <div
        className={cn(
          "border-border flex h-14 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Brand label={collapsed ? null : undefined} className={collapsed ? "" : "font-normal"} />
      </div>

      <nav className="flex-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "mb-1 flex items-center rounded text-sm transition-colors",
                collapsed ? "justify-center p-2" : "gap-2 px-2 py-1.5",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-border border-t p-2">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-2 px-2 py-1")}>
          <div className="bg-muted flex size-6 shrink-0 items-center justify-center rounded text-xs">
            {userEmail.charAt(0).toLowerCase()}
          </div>
          {!collapsed && (
            <Muted className="min-w-0 flex-1 truncate" title={userEmail}>
              {userEmail}
            </Muted>
          )}
          <form action="/logout" method="POST">
            {/* IconButton defaults to type="button"; inside a POST form it must
                be a submit button or logout silently does nothing. */}
            <IconButton
              type="submit"
              className={cn("rounded", collapsed ? "p-1.5" : "p-1")}
              title="logout"
              aria-label="logout"
            >
              <IconLogout className="size-3.5" />
            </IconButton>
          </form>
        </div>
      </div>

      <IconButton
        className="border-border h-8 border-t"
        onClick={toggleCollapsed}
        title={collapsed ? "expand" : "collapse"}
        aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
        aria-expanded={!collapsed}
      >
        <IconChevronLeft
          className={cn("size-3.5 transition-transform duration-200", collapsed && "rotate-180")}
        />
      </IconButton>
    </aside>
  );
}
