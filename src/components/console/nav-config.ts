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
  Mail,
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
      { href: "/console/content", labelKey: "navContent", icon: FileText },
      { href: "/console/data-hub", labelKey: "navDataHub", icon: Database },
      { href: "/console/taxonomy", labelKey: "navTaxonomy", icon: Tag },
    ],
  },
  {
    labelKey: "platform",
    items: [
      { href: "/console/users", labelKey: "navUsers", icon: Users },
      { href: "/console/settings", labelKey: "navSettings", icon: Settings },
      { href: ROUTES.CONSOLE_NEWSLETTER, labelKey: "navNewsletter", icon: Mail },
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

const CONSOLE_NAV_ITEMS = CONSOLE_NAV.flatMap((g) => g.items);

/**
 * The nav item the current page belongs to: the longest matching href, so
 * `/console/requests/premium` lights up "Premium" and not "Requests" too.
 */
export function activeConsoleItem(pathname: string): ConsoleNavItem | undefined {
  return [...CONSOLE_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === "/console" ? pathname === "/console" : pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
}
