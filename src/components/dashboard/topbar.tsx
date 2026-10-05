"use client";

import { Building2, CircleHelp, MessageSquare, Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useSearch } from "@/lib/search/search-context";
import { useAwaitingReplies } from "@/hooks/use-awaiting-replies";
import { WorkspaceAccountMenu } from "@/components/workspace/account-menu";
import { WorkspaceLanguageToggle } from "@/components/workspace/language-toggle";
import { DASHBOARD_NAV_ITEMS, isNavActive } from "./nav-config";

const iconButton =
  "relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-market-navy hover:ring-slate-300";

/** Desktop top bar of the company dashboard: where am I, search, help, inbox, language, account. */
export function DashboardTopbar() {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { openSearch } = useSearch();
  const awaiting = useAwaitingReplies(user?.id);

  const current = [...DASHBOARD_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isNavActive(pathname, item.href));
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-20 hidden items-center gap-3 bg-slate-100/85 px-6 py-3 backdrop-blur md:flex">
      <nav aria-label={t("breadcrumb")} className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Link href="/dashboard" className="text-slate-500 hover:text-market-navy">
          {t("title")}
        </Link>
        {current && current.href !== "/dashboard" && (
          <>
            <span className="text-slate-300" aria-hidden>/</span>
            <span className="truncate font-medium text-market-navy">{t(current.labelKey)}</span>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={openSearch}
        className="ml-auto flex w-full max-w-[300px] items-center gap-2 rounded-full bg-white px-3.5 py-2 text-left text-[13px] text-slate-400 ring-1 ring-slate-200 transition-colors hover:ring-slate-300"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="flex-1">{t("topbar.search")}</span>
        <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-slate-500">⌘K</kbd>
      </button>

      <Link href="/help" className={iconButton} aria-label={t("topbar.help")} title={t("topbar.help")}>
        <CircleHelp className="h-[18px] w-[18px]" aria-hidden />
      </Link>
      <Link href="/dashboard/inbox" className={iconButton} aria-label={t("topbar.inbox")} title={t("topbar.inbox")}>
        <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
        {awaiting.count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-market-red ring-2 ring-white">
            <span className="sr-only">{t("topbar.unread", { count: awaiting.count })}</span>
          </span>
        )}
      </Link>

      <WorkspaceLanguageToggle />

      <WorkspaceAccountMenu
        displayName={displayName}
        email={user?.email ?? null}
        links={[
          { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
          { href: "/dashboard/companies", label: t("nav.companies"), icon: Building2 },
        ]}
        backToSiteLabel={t("topbar.backToSite")}
        signOutLabel={t("signOut")}
        onSignOut={signOut}
      />
    </header>
  );
}
