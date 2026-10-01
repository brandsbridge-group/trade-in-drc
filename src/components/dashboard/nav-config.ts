import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Wrench,
} from "lucide-react";

export interface DashboardNavItem {
  href: string;
  /** Key under the `Dashboard` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /** Shows the awaiting-replies count. */
  badge?: "messages";
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
      { href: "/dashboard/services", labelKey: "nav.services", icon: Wrench },
    ],
  },
  {
    labelKey: "trade",
    items: [
      { href: "/dashboard/rfq", labelKey: "nav.rfq", icon: FileText },
      { href: "/dashboard/opportunities", labelKey: "nav.opportunities", icon: Briefcase },
      { href: "/dashboard/inbox", labelKey: "nav.inbox", icon: MessageSquare, badge: "messages" },
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
