"use client";

import { ChevronsUpDown, Crown, LogOut, Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useAwaitingReplies } from "@/hooks/use-awaiting-replies";
import { HOME_COUNTRY } from "@/config/geo";
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

/** Everything the navy sidebar shows, shared by the desktop rail and the phone drawer. */
function SidebarBody({ collapsed, inDrawer = false }: { collapsed: boolean; inDrawer?: boolean }) {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { data } = useCompanies(user?.id);
  const awaiting = useAwaitingReplies(user?.id);

  const companies = (data ?? []) as unknown as SidebarCompany[];
  const primary = companies[0];
  const hasPremium = companies.some((c) => c.is_premium);
  const congolese = !primary?.country || primary.country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const Item = inDrawer ? SheetClose : "div";

  return (
    <div className="flex h-full flex-col">
      {/* Company switcher */}
      {primary && (
        <Link
          href="/dashboard/companies"
          title={collapsed ? primary.name : undefined}
          className={cn(
            "mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2 ring-1 ring-white/10 transition-colors hover:bg-white/10",
            collapsed && "mx-2 justify-center p-1.5"
          )}
        >
          {primary.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner logo, tiny avatar
            <img src={primary.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg bg-white object-cover" />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-market-or text-[11px] font-bold text-market-navy">
              {initials(primary.name)}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-white">{primary.name}</span>
                <span className="block truncate text-[11px] text-white/50">
                  {t(congolese ? "companyType.congolese" : "companyType.international")}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden />
            </>
          )}
        </Link>
      )}

      {/* Navigation */}
      <nav aria-label={t("title")} className="flex-1 space-y-4 overflow-y-auto px-3">
        {DASHBOARD_NAV.map((group) => (
          <div key={group.labelKey}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {t(`navGroups.${group.labelKey}`)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, labelKey, icon: Icon, badge }) => {
                const active = isNavActive(pathname, href);
                const label = t(labelKey);
                const count = badge === "messages" ? awaiting.count : 0;
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
                            ? "bg-market-or font-semibold text-market-navy"
                            : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                        {!collapsed && <span className="flex-1 truncate">{label}</span>}
                        {count > 0 && (
                          <span
                            className={cn(
                              "grid min-w-[20px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold leading-5",
                              active ? "bg-market-navy text-white" : "bg-market-red text-white",
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

      {/* Premium promo */}
      {!collapsed && primary && !hasPremium && (
        <div className="mx-3 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-market-or via-market-or to-market-or-dark p-4 text-market-navy">
          <Crown className="h-5 w-5" aria-hidden />
          <p className="mt-2 font-display text-sm font-semibold">{t("premiumPromo.title")}</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-market-navy/75">{t("premiumPromo.body")}</p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex rounded-lg bg-market-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            {t("premiumPromo.cta")}
          </Link>
        </div>
      )}

      {/* User */}
      <div className={cn("mt-4 flex items-center gap-2.5 border-t border-white/10 px-4 py-3.5", collapsed && "flex-col px-2")}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-market-or-light ring-1 ring-white/15">
          {initials(displayName) || "·"}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium text-white">{displayName}</span>
            <span className="block truncate text-[11px] text-white/45">{user?.email}</span>
          </span>
        )}
        <button
          type="button"
          onClick={signOut}
          aria-label={t("signOut")}
          title={t("signOut")}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="h-7 w-7 shrink-0 rounded-lg"
      style={{
        background:
          "linear-gradient(135deg,#0B6FD1 0 38%,#F5B800 38% 43%,#D8232A 43% 57%,#F5B800 57% 62%,#0B6FD1 62%)",
      }}
    />
  );
}

/** Desktop navy rail (md and up); phones get {@link MobileDashboardBar}. */
export function Sidebar() {
  const t = useTranslations("Dashboard");
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col bg-market-navy py-4 transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[76px]" : "w-[252px]"
      )}
    >
      <div className={cn("mb-5 flex items-center gap-2.5 px-5", sidebarCollapsed && "flex-col px-2")}>
        <Link href="/" className="flex items-center gap-2.5" title="Trade in DRC">
          <BrandMark />
          {!sidebarCollapsed && (
            <span className="font-display text-[15px] font-semibold text-white">
              Trade in <span className="text-market-or">DRC</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn("rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white", !sidebarCollapsed && "ml-auto")}
          aria-label={sidebarCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <SidebarBody collapsed={sidebarCollapsed} />
    </aside>
  );
}

/** Phone top bar: the same navy navigation in a drawer, so content keeps the full width. */
export function MobileDashboardBar() {
  const t = useTranslations("Dashboard");
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-market-navy px-3 py-2.5 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button" aria-label={t("nav.openMenu")} className="rounded-lg p-1.5 text-white/80 hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[82%] max-w-[300px] flex-col border-0 bg-market-navy p-0 py-4 text-white">
          <SheetTitle className="mb-4 flex items-center gap-2.5 px-5 font-display text-[15px] font-semibold text-white">
            <BrandMark />
            <span>
              Trade in <span className="text-market-or">DRC</span>
            </span>
          </SheetTitle>
          <SidebarBody collapsed={false} inDrawer />
        </SheetContent>
      </Sheet>
      <Link href="/" className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <BrandMark />
        Trade in <span className="text-market-or">DRC</span>
      </Link>
    </div>
  );
}
