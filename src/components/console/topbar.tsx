"use client";

import { Search, Settings, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useSearch } from "@/lib/search/search-context";
import { WorkspaceAccountMenu } from "@/components/workspace/account-menu";
import { WorkspaceLanguageToggle } from "@/components/workspace/language-toggle";
import { activeConsoleItem } from "./nav-config";

/** Desktop top bar of the staff console: where am I, search, language, account. */
export function ConsoleTopbar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const t = useTranslations("Admin.nav");
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { openSearch } = useSearch();

  const current = activeConsoleItem(pathname);
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-20 hidden items-center gap-3 bg-slate-100/85 px-6 py-3 backdrop-blur md:flex">
      <nav aria-label={t("breadcrumb")} className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Link href="/console" className="text-slate-500 hover:text-market-navy">
          {t("console")}
        </Link>
        {current && current.href !== "/console" && (
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
        <span className="flex-1">{t("search")}</span>
        <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-slate-500">⌘K</kbd>
      </button>

      <WorkspaceLanguageToggle />

      <WorkspaceAccountMenu
        displayName={displayName}
        email={user?.email ?? null}
        roleLabel={t(isSuperAdmin ? "roleSuperAdmin" : "roleModerator")}
        links={[
          { href: "/dashboard/settings/account", label: t("myAccount"), icon: UserCog },
          // Site settings are a super-admin section.
          ...(isSuperAdmin ? [{ href: "/console/settings", label: t("navSettings"), icon: Settings }] : []),
        ]}
        backToSiteLabel={t("backToSite")}
        signOutLabel={t("signOut")}
        onSignOut={signOut}
      />
    </header>
  );
}
