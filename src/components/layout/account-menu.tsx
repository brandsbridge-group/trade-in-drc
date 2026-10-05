"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import {
    ArrowUpRight,
    Building2,
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Mail,
    Package,
    Plus,
    Settings,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { MESSAGING_ENABLED } from "@/config/features";
import { COMPANY_STATUS } from "@/constants/status";
import { isAdmin, isSuperAdmin } from "@/constants/roles";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountCompany {
    id: string;
    name: string;
    status: string;
    logo_url: string | null;
}

interface AccountInfo {
    fullName: string | null;
    isStaff: boolean;
    isSuperAdmin: boolean;
    companies: AccountCompany[];
}

const STATUS_DOT: Record<string, string> = {
    [COMPANY_STATUS.VERIFIED]: "bg-emerald-500",
    [COMPANY_STATUS.PENDING]: "bg-blue-500",
    [COMPANY_STATUS.PENDING_DOCUMENTS]: "bg-amber-500",
    [COMPANY_STATUS.REJECTED]: "bg-market-red",
};

/** "Emmanuel Mulamba" → "EM"; falls back to the first two letters of the e-mail. */
export function accountInitials(fullName: string | null | undefined, email: string | null | undefined): string {
    const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) return words.slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase();
    return (email ?? "").slice(0, 2).toUpperCase() || "?";
}

/**
 * Who is signed in, for the navbar: name, staff tier and (for a company
 * account) its companies with their verification status. Read once per
 * session; `null` while loading.
 */
function useAccountInfo(user: User | null): AccountInfo | null {
    const [info, setInfo] = React.useState<AccountInfo | null>(null);

    React.useEffect(() => {
        if (!user) {
            setInfo(null);
            return;
        }
        let cancelled = false;
        const supabase = createClient();
        Promise.all([
            supabase.from("profiles").select("full_name, role, staff_role, account_type").eq("id", user.id).maybeSingle(),
            supabase.from("companies").select("id, name, status, logo_url").eq("owner_id", user.id).order("created_at", { ascending: true }),
        ]).then(([profile, companies]) => {
            if (cancelled) return;
            setInfo({
                fullName: profile.data?.full_name?.trim() || null,
                isStaff: isAdmin(profile.data),
                isSuperAdmin: isSuperAdmin(profile.data),
                companies: (companies.data ?? []) as AccountCompany[],
            });
        });
        return () => {
            cancelled = true;
        };
    }, [user]);

    return info;
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: React.ReactNode }) {
    return (
        <DropdownMenuItem asChild className="h-10 cursor-pointer rounded-lg px-2.5 text-[13.5px] font-medium text-slate-700 focus:bg-slate-100 focus:text-market-navy">
            <Link href={href}>
                <Icon className="h-4 w-4 text-slate-400" aria-hidden />
                {children}
            </Link>
        </DropdownMenuItem>
    );
}

/**
 * Navbar account menu. Three blocks, top to bottom: who is signed in (name,
 * e-mail, role), the place they work in (their company with its verification
 * status, or the staff console), then shortcuts and sign-out. Staff never see
 * company-area links — the proxy would bounce them back to the console.
 */
export function AccountMenu({ user, signOut }: { user: User; signOut: () => void | Promise<void> }) {
    const t = useTranslations("Nav.account");
    const info = useAccountInfo(user);

    const fullName = info?.fullName ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null);
    const initials = accountInitials(fullName, user.email);
    const company = info?.companies[0] ?? null;
    const otherCompanies = Math.max((info?.companies.length ?? 0) - 1, 0);
    const role = info ? (info.isSuperAdmin ? "super_admin" : info.isStaff ? "moderator" : company ? "company" : "member") : null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={t("open")}
                    className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15 outline-none transition-colors duration-150 ease-out hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/50 data-[state=open]:bg-white/15"
                >
                    {/* Frosted pill like the language switcher: white disc, navy initials — the gold stays reserved for the "publish" CTA. */}
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[11px] font-bold text-market-navy" aria-hidden>
                        {initials}
                    </span>
                    <ChevronDown
                        className="h-3.5 w-3.5 text-white/70 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180"
                        aria-hidden
                    />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={10} aria-label={t("menu")} className="w-[19.5rem] rounded-2xl border-slate-200/80 p-0 shadow-xl">
                {/* Who is signed in */}
                <div className="flex items-center gap-3 p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-market-navy text-sm font-semibold text-market-or-light" aria-hidden>
                        {initials}
                    </span>
                    <div className="min-w-0">
                        {fullName && <p className="truncate text-sm font-semibold text-market-navy">{fullName}</p>}
                        <p className={cn("truncate", fullName ? "text-xs text-slate-500" : "text-sm font-semibold text-market-navy")}>{user.email}</p>
                        {role && (
                            <span
                                className={cn(
                                    "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    info?.isStaff ? "bg-market-navy text-white" : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {info?.isStaff && <ShieldCheck className="h-3 w-3" aria-hidden />}
                                {t(`roles.${role}`)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Where they work: the console for staff, the company for an owner */}
                {info && (
                    <div className="px-2 pb-2">
                        {info.isStaff ? (
                            <DropdownMenuItem asChild className="cursor-pointer rounded-xl bg-slate-50 p-3 focus:bg-slate-100">
                                <Link href={ROUTES.CONSOLE}>
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-market-navy text-market-or-light" aria-hidden>
                                        <ShieldCheck className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13.5px] font-semibold text-market-navy">{t("staffTitle")}</span>
                                        <span className="block text-xs leading-snug text-slate-500">{t("staffBody")}</span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                </Link>
                            </DropdownMenuItem>
                        ) : company ? (
                            <DropdownMenuItem asChild className="cursor-pointer rounded-xl bg-slate-50 p-3 focus:bg-slate-100">
                                <Link href={ROUTES.DASHBOARD} aria-label={t("company.open", { name: company.name })}>
                                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200" aria-hidden>
                                        {company.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded logo on Supabase storage
                                            <img src={company.logo_url} alt="" className="h-full w-full object-contain p-1" />
                                        ) : (
                                            <Building2 className="h-5 w-5 text-slate-400" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13.5px] font-semibold text-market-navy">{company.name}</span>
                                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[company.status] ?? "bg-slate-400")} aria-hidden />
                                            {t.has(`status.${company.status}`) ? t(`status.${company.status}`) : company.status}
                                        </span>
                                        {otherCompanies > 0 && <span className="mt-0.5 block text-[11.5px] text-slate-400">{t("company.more", { count: otherCompanies })}</span>}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem asChild className="cursor-pointer rounded-xl border border-dashed border-slate-300 p-3 focus:bg-slate-50">
                                <Link href={ROUTES.DASHBOARD_COMPANIES_NEW}>
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-market-or/15 text-market-or-dark" aria-hidden>
                                        <Plus className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[13.5px] font-semibold text-market-navy">{t("company.noneTitle")}</span>
                                        <span className="block text-xs leading-snug text-slate-500">{t("company.noneBody")}</span>
                                    </span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                    </div>
                )}

                <DropdownMenuSeparator className="m-0 bg-slate-100" />

                <div className="p-2">
                    {info?.isStaff ? (
                        <>
                            <MenuLink href={ROUTES.CONSOLE} icon={LayoutDashboard}>{t("links.console")}</MenuLink>
                            <MenuLink href={ROUTES.CONSOLE_VERIFICATIONS} icon={ShieldCheck}>{t("links.verifications")}</MenuLink>
                            <MenuLink href={ROUTES.CONSOLE_COMPANIES} icon={Building2}>{t("links.consoleCompanies")}</MenuLink>
                        </>
                    ) : (
                        <>
                            <MenuLink href={ROUTES.DASHBOARD} icon={LayoutDashboard}>{t("links.dashboard")}</MenuLink>
                            {company && <MenuLink href={ROUTES.DASHBOARD_COMPANIES} icon={Building2}>{t("links.companies")}</MenuLink>}
                            {company && <MenuLink href={ROUTES.DASHBOARD_PRODUCTS} icon={Package}>{t("links.products")}</MenuLink>}
                            {MESSAGING_ENABLED && <MenuLink href={ROUTES.DASHBOARD_INBOX} icon={Mail}>{t("links.inbox")}</MenuLink>}
                            {company?.status === COMPANY_STATUS.VERIFIED && (
                                <MenuLink href={`${ROUTES.COMPANIES}/${company.id}`} icon={ArrowUpRight}>{t("links.publicProfile")}</MenuLink>
                            )}
                        </>
                    )}
                    <MenuLink href={ROUTES.DASHBOARD_SETTINGS} icon={Settings}>{t("links.settings")}</MenuLink>
                </div>

                <DropdownMenuSeparator className="m-0 bg-slate-100" />

                <div className="p-2">
                    <DropdownMenuItem
                        onClick={() => signOut()}
                        className="h-10 cursor-pointer rounded-lg px-2.5 text-[13.5px] font-medium text-market-red focus:bg-red-50 focus:text-market-red"
                    >
                        <LogOut className="h-4 w-4 text-market-red" aria-hidden />
                        {t("signout")}
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
