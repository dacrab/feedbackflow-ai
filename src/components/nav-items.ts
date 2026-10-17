import { IconHome, IconInbox, IconSettings } from "@tabler/icons-react";

/** Shared by the sidebar and the mobile tab bar so the two can't drift. */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "dashboard", icon: IconHome },
  { href: "/inbox", label: "inbox", icon: IconInbox },
  { href: "/settings", label: "settings", icon: IconSettings },
];

/** A nav item owns its subtree, so /inbox/123 keeps inbox highlighted while an
 *  unrelated path does not. Shared so both navs agree. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
