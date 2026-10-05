"use client";

import { WorkspaceLanguageToggle } from "@/components/workspace/language-toggle";
import { ChevronsUpDown, Crown, LogOut, Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useAwaitingReplies } from "@/hooks/use-awaiting-replies";
import { useReceivedRequests } from "@/hooks/use-received-requests";
import { HOME_COUNTRY } from "@/config/geo";
import { Logo } from "@/components/ui/logo";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DASHBOARD_NAV, isNavActive } from "./nav-config";

interface SidebarCompany {
  name: string;
  country: string | null;
  logo_url: string | null;
  is_premium: boolean;
}

function initials(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Everything the sidebar shows, shared by the desktop panel and the phone
 * drawer. White surface; navy is reserved for the selected item and the
 * subscription-upgrade card.
 */
function SidebarBody({ collapsed, inDrawer = false }: { collapsed: boolean; inDrawer?: boolean }) {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { data } = useCompanies(user?.id);
  const awaiting = useAwaitingReplies(user?.id);
  const received = useReceivedRequests(user?.id);

  const companies = (data ?? []) as unknown as SidebarCompany[];
  const primary = companies[0];
  const hasPremium = companies.some((c) => c.is_premium);
  const congolese = !primary?.country || primary.country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const Item = inDrawer ? SheetClose : "div";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Company switcher */}
      {primary && (
        <Link
          href="/dashboard/companies"
          title={collapsed ? primary.name : undefined}
          className={cn(
            "mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-100",
            collapsed && "mx-2 justify-center p-1.5"
          )}
        >
          {primary.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner logo, tiny avatar
            <img src={primary.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg bg-white object-cover ring-1 ring-slate-200" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-market-navy text-[11px] font-bold text-market-or-light">
              {initials(primary.name)}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-market-navy">{primary.name}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {t(congolese ? "companyType.congolese" : "companyType.international")}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            </>
          )}
        </Link>
      )}

      {/* Navigation and the upgrade card scroll TOGETHER. The card used to be
          pinned under the nav, so on a short screen it took the room and left
          the menu a few rows high; now only the account block stays pinned. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-slim">
      <nav aria-label={t("title")} className="space-y-4 px-3">
        {DASHBOARD_NAV.map((group) => (
          <div key={group.labelKey}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {t(`navGroups.${group.labelKey}`)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, labelKey, icon: Icon, badge }) => {
                const active = isNavActive(pathname, href);
                const label = t(labelKey);
                const count = badge === "messages" ? awaiting.count : badge === "requests" ? received.unseenCount : 0;
                return (
                  <li key={href}>
                    <Item {...(inDrawer ? { asChild: true } : {})}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-market-navy font-semibold text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-market-navy"
                        )}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-market-or-light")} aria-hidden />
                        {!collapsed && <span className="flex-1 truncate">{label}</span>}
                        {count > 0 && (
                          <span
                            className={cn(
                              "grid min-w-[20px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold leading-5",
                              active ? "bg-market-or text-market-navy" : "bg-market-red text-white",
                              collapsed && "absolute -right-1 -top-1 min-w-[16px] px-1 leading-4"
                            )}
                          >
                            <span className="sr-only">{t("unreadSr")} </span>
                            {count}
                          </span>
                        )}
                      </Link>
                    </Item>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="h-4 shrink-0" aria-hidden />

      {/* Subscription upgrade — the one navy block besides the selected item.
          mt-auto keeps it at the bottom when there is room; on short screens
          it drops its description to stay compact. */}
      {!collapsed && primary && !hasPremium && (
        <div className="relative mx-3 mt-auto shrink-0 overflow-hidden rounded-2xl bg-market-navy p-4 text-white [@media(max-height:820px)]:p-3.5">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-market-or/25 blur-2xl" />
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-market-or-light ring-1 ring-white/15">
            <Crown className="h-4 w-4" aria-hidden />
          </span>
          <p className="relative mt-3 font-display text-[15px] font-semibold">{t("premiumPromo.title")}</p>
          <p className="relative mt-1 text-[10.5px] leading-snug text-white/65">{t("premiumPromo.body")}</p>
          <Link
            href="/pricing"
            className="relative mt-3.5 flex justify-center rounded-xl bg-market-or px-3 py-2 text-xs font-bold text-market-navy transition-colors hover:bg-market-or-light"
          >
            {t("premiumPromo.cta")}
          </Link>
        </div>
      )}

      </div>

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
          onClick={signOut}
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

/** Desktop white panel floating on the grey canvas (md and up); phones get {@link MobileDashboardBar}. */
export function Sidebar() {
  const t = useTranslations("Dashboard");
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
          aria-label={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <SidebarBody collapsed={sidebarCollapsed} />
    </aside>
  );
}

/** Phone top bar: the same white navigation in a drawer, so content keeps the full width. */
export function MobileDashboardBar() {
  const t = useTranslations("Dashboard");
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/95 px-3 py-2.5 backdrop-blur md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" aria-label={t("nav.openMenu")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[82%] max-w-[300px] flex-col bg-white p-0 py-4">
          <SheetTitle className="mb-4 flex items-center justify-center px-5">
            <Logo size="md" />
          </SheetTitle>
          <SidebarBody collapsed={false} inDrawer />
        </SheetContent>
      </Sheet>
      <Link href="/" className="flex shrink-0 items-center">
        <Logo size="sm" />
      </Link>
      <WorkspaceLanguageToggle className="ml-auto" />
    </div>
  );
}
