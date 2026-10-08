import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle,
  Crown,
  Database,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  Settings,
  Tag,
  Users,
} from "lucide-react";
import { ROUTES, SUPER_ADMIN_ROUTES } from "@/constants/routes";

export interface ConsoleNavItem {
  href: string;
  /** Key under the `Admin.nav` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /** Sections reached from this item's own tabs: they keep it lit in the sidebar. */
  also?: string[];
}

export interface ConsoleNavGroup {
  /** Key under `Admin.nav.groups`. */
  labelKey: string;
  items: ConsoleNavItem[];
}

/** Staff console navigation, grouped like the sidebar renders it. */
export const CONSOLE_NAV: ConsoleNavGroup[] = [
  {
    labelKey: "overview",
    items: [
      { href: "/console", labelKey: "navDashboard", icon: LayoutDashboard },
      { href: "/console/analytics", labelKey: "navAnalytics", icon: BarChart3 },
    ],
  },
  {
    labelKey: "moderation",
    items: [
      { href: "/console/verifications", labelKey: "navVerifications", icon: CheckCircle },
      { href: "/console/companies", labelKey: "navCompanies", icon: Building2 },
      { href: "/console/opportunities", labelKey: "navOpportunities", icon: Briefcase },
      { href: "/console/requests", labelKey: "navRequests", icon: Inbox },
      { href: "/console/requests/premium", labelKey: "navPremium", icon: Crown },
      { href: "/console/messages", labelKey: "navMessages", icon: MessageSquareWarning },
    ],
  },
  {
    labelKey: "content",
    items: [
      // The newsletter is a tab of Content (between News and Events), not an entry of its own.
      { href: "/console/content", labelKey: "navContent", icon: FileText, also: [ROUTES.CONSOLE_NEWSLETTER] },
      { href: "/console/data-hub", labelKey: "navDataHub", icon: Database },
      { href: "/console/taxonomy", labelKey: "navTaxonomy", icon: Tag },
    ],
  },
  {
    labelKey: "platform",
    items: [
      { href: "/console/users", labelKey: "navUsers", icon: Users },
      { href: "/console/settings", labelKey: "navSettings", icon: Settings },
    ],
  },
];

/** Moderators can't open super-admin sections (proxy + requireSuperAdmin), so don't list them. */
export function visibleConsoleNav(isSuperAdmin: boolean): ConsoleNavGroup[] {
  if (isSuperAdmin) return CONSOLE_NAV;
  return CONSOLE_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !(SUPER_ADMIN_ROUTES as readonly string[]).includes(item.href)),
  })).filter((group) => group.items.length > 0);
}

// Every route an item answers for, paired with the item.
const CONSOLE_NAV_ROUTES = CONSOLE_NAV.flatMap((group) =>
  group.items.flatMap((item) => [item.href, ...(item.also ?? [])].map((route) => ({ route, item })))
);

/**
 * The nav item the current page belongs to: the longest matching href, so
 * `/console/requests/premium` lights up "Premium" and not "Requests" too.
 */
export function activeConsoleItem(pathname: string): ConsoleNavItem | undefined {
  return [...CONSOLE_NAV_ROUTES]
    .sort((a, b) => b.route.length - a.route.length)
    .find(({ route }) =>
      route === "/console" ? pathname === "/console" : pathname === route || pathname.startsWith(`${route}/`)
    )?.item;
}
