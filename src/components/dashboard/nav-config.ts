import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Wrench,
} from "lucide-react";
import { MESSAGING_ENABLED } from "@/config/features";

export interface DashboardNavItem {
  href: string;
  /** Key under the `Dashboard` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /** Shows the awaiting-replies count, or the buyer requests not opened yet. */
  badge?: "messages" | "requests";
}

export interface DashboardNavGroup {
  /** Key under `Dashboard.navGroups`. */
  labelKey: string;
  items: DashboardNavItem[];
}

/** Company dashboard navigation, grouped like the sidebar renders it. */
export const DASHBOARD_NAV: DashboardNavGroup[] = [
  {
    labelKey: "main",
    items: [
      { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
      { href: "/dashboard/companies", labelKey: "nav.companies", icon: Building2 },
      { href: "/dashboard/products", labelKey: "nav.products", icon: Package },
      // { href: "/dashboard/services", labelKey: "nav.services", icon: Wrench },
    ],
  },
  {
    labelKey: "trade",
    items: [
      { href: "/dashboard/requests", labelKey: "nav.requests", icon: Inbox, badge: "requests" },
      // No "quote requests" entry: a company publishes its offers and demands
      // as opportunities (/dashboard/rfq redirects there).
      { href: "/dashboard/opportunities", labelKey: "nav.opportunities", icon: Briefcase },
      // Direct messaging is switched off for now (src/config/features.ts).
      ...(MESSAGING_ENABLED
        ? [{ href: "/dashboard/inbox", labelKey: "nav.inbox", icon: MessageSquare, badge: "messages" } satisfies DashboardNavItem]
        : []),
    ],
  },
  {
    labelKey: "general",
    items: [
      { href: "/dashboard/analytics", labelKey: "nav.analytics", icon: BarChart3 },
      { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
];

export const DASHBOARD_NAV_ITEMS = DASHBOARD_NAV.flatMap((g) => g.items);

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
}
