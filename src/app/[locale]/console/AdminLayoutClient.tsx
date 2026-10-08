"use client";

import * as React from "react";
import { ConsoleSidebar, MobileConsoleBar } from "@/components/console/sidebar";
import { ConsoleTopbar } from "@/components/console/topbar";
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
    // Same shell as the company dashboard: soft grey canvas + white cards.
    // `console-surface` restyles shadcn cards and tables for every console page (globals.css).
    return (
        <div className="min-h-screen bg-slate-100 md:flex">
            <MobileConsoleBar isSuperAdmin={isSuperAdmin} />
            <ConsoleSidebar isSuperAdmin={isSuperAdmin} />
            <div className="flex min-w-0 flex-1 flex-col">
                <ConsoleTopbar isSuperAdmin={isSuperAdmin} />
                <main className="console-surface min-w-0 flex-1 px-4 pb-10 pt-4 md:px-6 md:pt-2">
                    <div className="mx-auto max-w-[1320px]">{children}</div>
                </main>
            </div>
        </div>
    );
}
