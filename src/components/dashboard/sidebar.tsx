"use client";

import {
  LayoutDashboard,
  Building2,
  Package,
  Wrench,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Briefcase,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useAuth } from "@/lib/auth/auth-provider";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/dashboard/companies", labelKey: "nav.companies", icon: Building2 },
  { href: "/dashboard/products", labelKey: "nav.products", icon: Package },
  { href: "/dashboard/services", labelKey: "nav.services", icon: Wrench },
  { href: "/dashboard/rfq", labelKey: "nav.rfq", icon: FileText },
  { href: "/dashboard/opportunities", labelKey: "nav.opportunities", icon: Briefcase },
  { href: "/dashboard/inbox", labelKey: "nav.inbox", icon: MessageSquare },
  { href: "/dashboard/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col shrink-0 bg-slate-50 border-r border-slate-200 transition-all duration-200"
      style={{ width: sidebarCollapsed ? "48px" : "200px" }}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold text-slate-700 truncate">
            {t("title")}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-slate-200 text-slate-500 shrink-0"
          aria-label={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 py-1.5 px-3 text-sm transition-colors ${
                isActive(href)
                  ? "bg-slate-200 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-2">
        {!sidebarCollapsed && (
          <p className="text-xs text-slate-500 truncate mb-1.5">
            {user?.email ?? ""}
          </p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 py-1.5 w-full text-sm text-slate-600 hover:bg-slate-100 rounded px-1 transition-colors"
          title={sidebarCollapsed ? t("signOut") : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>{t("signOut")}</span>}
        </button>
      </div>
    </aside>
  );
}
