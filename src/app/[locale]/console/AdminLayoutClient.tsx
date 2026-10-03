"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";
import { SUPER_ADMIN_ROUTES } from "@/constants/routes";
import {
    LayoutDashboard,
    Building2,
    Users,
    CheckCircle,
    FileText,
    Tag,
    BarChart3,
    Settings,
    LogOut,
    Briefcase,
    MessageSquareWarning,
    Inbox,
    Crown,
    Mail,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

const sidebarLinks = [
    { href: "/console", labelKey: "navDashboard", icon: LayoutDashboard },
    { href: "/console/verifications", labelKey: "navVerifications", icon: CheckCircle },
    { href: "/console/content", labelKey: "navContent", icon: FileText },
    { href: "/console/opportunities", labelKey: "navOpportunities", icon: Briefcase },
    { href: "/console/requests", labelKey: "navRequests", icon: Inbox },
    { href: "/console/requests/premium", labelKey: "navPremium", icon: Crown },
    { href: "/console/data-hub", labelKey: "navDataHub", icon: BarChart3 },
    { href: "/console/companies", labelKey: "navCompanies", icon: Building2 },
    { href: "/console/users", labelKey: "navUsers", icon: Users },
    { href: "/console/messages", labelKey: "navMessages", icon: MessageSquareWarning },
    { href: "/console/taxonomy", labelKey: "navTaxonomy", icon: Tag },
    { href: "/console/analytics", labelKey: "navAnalytics", icon: BarChart3 },
    { href: "/console/settings", labelKey: "navSettings", icon: Settings },
    { href: ROUTES.CONSOLE_NEWSLETTER, labelKey: "navNewsletter", icon: Mail },
] as const;

export default function AdminLayoutClient({
    children,
    isSuperAdmin,
}: {
    children: React.ReactNode;
    isSuperAdmin: boolean;
}) {
    const t = useTranslations("Admin.nav");
    // Moderators can't open these sections (proxy + requireSuperAdmin), so don't list them.
    const visibleLinks = isSuperAdmin
        ? sidebarLinks
        : sidebarLinks.filter(
              (link) => !(SUPER_ADMIN_ROUTES as readonly string[]).includes(link.href)
          );
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // Extract locale from pathname
    const locale = pathname.split("/")[1];

    return (
        <div className="min-h-screen flex">
            {/* Light Sidebar */}
            <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">T</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">TradeInDRC</p>
                            <p className="text-xs text-slate-500 leading-tight">{t("console")}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {visibleLinks.map((link) => {
                        const isActive = pathname === `/${locale}${link.href}`;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded",
                                    isActive
                                        ? "bg-slate-200 text-slate-900 font-medium"
                                        : "text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                <link.icon className={cn("w-4 h-4", isActive ? "text-slate-900" : "text-slate-500")} />
                                {t(link.labelKey)}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                            <p className="text-xs text-slate-500">{t("administrator")}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 w-full transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        {t("signOut")}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-slate-50">{children}</main>
        </div>
    );
}
