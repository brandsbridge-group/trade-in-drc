"use client";

import { WorkspaceLanguageToggle } from "@/components/workspace/language-toggle";
import { LogOut, Menu, PanelLeft, PanelLeftClose, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useAuth } from "@/lib/auth/auth-provider";
import { Logo } from "@/components/ui/logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeConsoleItem, visibleConsoleNav } from "./nav-config";

function initials(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Everything the console sidebar shows, shared by the desktop panel and the
 * phone drawer. Same visual language as the company dashboard: white surface,
 * navy reserved for the selected item.
 */
function SidebarBody({
  collapsed,
  isSuperAdmin,
  inDrawer = false,
}: {
  collapsed: boolean;
  isSuperAdmin: boolean;
  inDrawer?: boolean;
}) {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const groups = visibleConsoleNav(isSuperAdmin);
  const activeHref = activeConsoleItem(pathname)?.href;
  const roleLabel = t(isSuperAdmin ? "roleSuperAdmin" : "roleModerator");
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const Item = inDrawer ? SheetClose : "div";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Which area this is, and with which privileges */}
      <div
        title={collapsed ? `${t("console")} · ${roleLabel}` : undefined}
        className={cn(
          "mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/80",
          collapsed && "mx-2 justify-center p-1.5"
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-market-navy text-market-or-light">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-market-navy">{t("console")}</span>
            <span className="block truncate text-[11px] text-slate-500">{roleLabel}</span>
          </span>
        )}
      </div>

      <nav aria-label={t("console")} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 scrollbar-slim">
        {groups.map((group) => (
          <div key={group.labelKey}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {t(`groups.${group.labelKey}`)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, labelKey, icon: Icon }) => {
                const active = href === activeHref;
                const label = t(labelKey);
                return (
                  <li key={href}>
                    <Item {...(inDrawer ? { asChild: true } : {})}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-market-navy font-semibold text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-market-navy"
                        )}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-market-or-light")} aria-hidden />
                        {!collapsed && <span className="flex-1 truncate">{label}</span>}
                      </Link>
                    </Item>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={cn("mt-4 flex items-center gap-2.5 border-t border-slate-200/80 px-4 pt-3.5", collapsed && "flex-col px-2")}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-navy text-xs font-semibold text-market-or-light">
          {initials(displayName) || "·"}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-market-navy">{displayName}</span>
            <span className="block truncate text-[11px] text-slate-500">{user?.email}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          aria-label={t("signOut")}
          title={t("signOut")}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Desktop white panel floating on the grey canvas (md and up); phones get {@link MobileConsoleBar}. */
export function ConsoleSidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const t = useTranslations("Admin.nav");
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={cn(
        "sticky top-3 my-3 ml-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col rounded-2xl bg-white py-4 ring-1 ring-slate-200/70 transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[76px]" : "w-[252px]"
      )}
    >
      <div className={cn("relative mb-5 flex items-center justify-center gap-2.5 px-5", sidebarCollapsed && "flex-col px-2")}>
        <Link href="/" className="flex shrink-0 items-center" title="Trade in DRC">
          <Logo size={sidebarCollapsed ? "sm" : "md"} />
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn("rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-market-navy", !sidebarCollapsed && "absolute right-3 top-1/2 -translate-y-1/2")}
          aria-label={sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <SidebarBody collapsed={sidebarCollapsed} isSuperAdmin={isSuperAdmin} />
    </aside>
  );
}

/** Phone top bar: the same white navigation in a drawer, so content keeps the full width. */
export function MobileConsoleBar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const t = useTranslations("Admin.nav");
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/95 px-3 py-2.5 backdrop-blur md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" aria-label={t("openMenu")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[82%] max-w-[300px] flex-col bg-white p-0 py-4">
          <SheetTitle className="mb-4 flex items-center justify-center px-5">
            <Logo size="md" />
          </SheetTitle>
          <SidebarBody collapsed={false} isSuperAdmin={isSuperAdmin} inDrawer />
        </SheetContent>
      </Sheet>
      <Link href="/" className="flex shrink-0 items-center">
        <Logo size="sm" />
      </Link>
      <span className="ml-auto truncate text-xs font-semibold text-market-navy">{t("console")}</span>
      <WorkspaceLanguageToggle />
    </div>
  );
}
