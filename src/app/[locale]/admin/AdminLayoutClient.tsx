"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const sidebarLinks = [
    { href: "/admin", labelKey: "navDashboard", icon: LayoutDashboard },
    { href: "/admin/verifications", labelKey: "navVerifications", icon: CheckCircle },
    { href: "/admin/content", labelKey: "navContent", icon: FileText },
    { href: "/admin/opportunities", labelKey: "navOpportunities", icon: Briefcase },
    { href: "/admin/requests", labelKey: "navRequests", icon: Inbox },
    { href: "/admin/requests/premium", labelKey: "navPremium", icon: Crown },
    { href: "/admin/data-hub", labelKey: "navDataHub", icon: BarChart3 },
    { href: "/admin/companies", labelKey: "navCompanies", icon: Building2 },
    { href: "/admin/users", labelKey: "navUsers", icon: Users },
    { href: "/admin/messages", labelKey: "navMessages", icon: MessageSquareWarning },
    { href: "/admin/taxonomy", labelKey: "navTaxonomy", icon: Tag },
    { href: "/admin/analytics", labelKey: "navAnalytics", icon: BarChart3 },
    { href: "/admin/settings", labelKey: "navSettings", icon: Settings },
] as const;

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations("Admin.nav");
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
                    {sidebarLinks.map((link) => {
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
