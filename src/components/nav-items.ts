import { IconHome, IconInbox, IconSettings } from "@tabler/icons-react";

/** Shared by the sidebar and the mobile tab bar so the two can't drift. */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "dashboard", icon: IconHome },
  { href: "/inbox", label: "inbox", icon: IconInbox },
  { href: "/settings", label: "settings", icon: IconSettings },
];
