"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    MessageSquare,
    TrendingUp,
    PieChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/design";

const STATUS_BADGE_VARIANT: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
> = {
    verified: "default",
    pending: "secondary",
    rejected: "destructive",
};

interface SectorSlice {
    id: string;
    name: string;
    count: number;
}

interface TopCompany {
    id: string;
    name: string;
    status: string;
    views: number;
}

interface DashboardData {
    totalCompanies: number;
    pending: number;
    verified: number;
    rejected: number;
    totalViews: number;
    contactRequests: number;
    sectorDistribution: SectorSlice[];
    topCompanies: TopCompany[];
}

const EMPTY: DashboardData = {
    totalCompanies: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    totalViews: 0,
    contactRequests: 0,
    sectorDistribution: [],
    topCompanies: [],
};

export default function AdminDashboardPage() {
    const t = useTranslations("Admin.dashboard");
    const locale = useLocale();
    const [data, setData] = React.useState<DashboardData>(EMPTY);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            try {
                const localizedSectorName =
                    locale === "fr" ? "name_fr" : "name_en";

                const [companiesRes, sectorsRes, eventsRes] = await Promise.all([
                    supabase.from("companies").select("id, name, status, sector_id"),
                    supabase
                        .from("sectors")
                        .select(`id, ${localizedSectorName}`),
                    supabase
                        .from("analytics_events")
                        .select("entity_id, entity_type, event_type")
                        .eq("entity_type", "company"),
                ]);

                if (companiesRes.error) throw companiesRes.error;
                if (sectorsRes.error) throw sectorsRes.error;
                if (eventsRes.error) throw eventsRes.error;

                const companies = companiesRes.data ?? [];
                const sectors = sectorsRes.data ?? [];
                const events = eventsRes.data ?? [];

                // Sector distribution.
                const sectorNames = new Map<string, string>();
                for (const s of sectors as Array<Record<string, string>>) {
                    sectorNames.set(s.id, s[localizedSectorName]);
                }
                const sectorCounts = new Map<string, number>();
                for (const c of companies) {
                    if (!c.sector_id) continue;
                    sectorCounts.set(
                        c.sector_id,
                        (sectorCounts.get(c.sector_id) ?? 0) + 1
                    );
                }
                const sectorDistribution: SectorSlice[] = Array.from(
                    sectorCounts.entries()
                )
                    .map(([id, count]) => ({
                        id,
                        name: sectorNames.get(id) ?? id,
                        count,
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                // View / contact-request KPIs from analytics_events.
                const viewsByCompany = new Map<string, number>();
                let totalViews = 0;
                let contactRequests = 0;
                for (const e of events) {
                    if (e.event_type === "view") {
                        totalViews += 1;
                        viewsByCompany.set(
                            e.entity_id,
                            (viewsByCompany.get(e.entity_id) ?? 0) + 1
                        );
                    } else if (e.event_type === "contact_request") {
                        contactRequests += 1;
                    }
                }

                const companyNames = new Map<string, { name: string; status: string }>();
                for (const c of companies) {
                    companyNames.set(c.id, { name: c.name, status: c.status });
                }
                const topCompanies: TopCompany[] = Array.from(viewsByCompany.entries())
                    .map(([id, views]) => ({
                        id,
                        name: companyNames.get(id)?.name ?? "—",
                        status: companyNames.get(id)?.status ?? "pending",
                        views,
                    }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5);

                setData({
                    totalCompanies: companies.length,
                    pending: companies.filter((c) => c.status === "pending").length,
                    verified: companies.filter((c) => c.status === "verified").length,
                    rejected: companies.filter((c) => c.status === "rejected").length,
                    totalViews,
                    contactRequests,
                    sectorDistribution,
                    topCompanies,
                });
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [locale]);

    const statCards = [
        { key: "total", value: data.totalCompanies, icon: Building2, color: "text-primary" },
        { key: "pending", value: data.pending, icon: Clock, color: "text-amber-500" },
        { key: "verified", value: data.verified, icon: CheckCircle, color: "text-green-500" },
        { key: "rejected", value: data.rejected, icon: XCircle, color: "text-destructive" },
        { key: "views", value: data.totalViews, icon: Eye, color: "text-blue-500" },
        {
            key: "contacts",
            value: data.contactRequests,
            icon: MessageSquare,
            color: "text-violet-500",
        },
    ] as const;

    const maxSectorCount = data.sectorDistribution[0]?.count ?? 1;

    return (
        <div className="p-4">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            {error ? (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="py-6 text-center text-sm text-destructive">
                        {t("loadError")}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* KPI cards */}
                    <div className="mb-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                        {statCards.map((card, index) => (
                            <motion.div
                                key={card.key}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.25 }}
                            >
                                <Card className="rounded-xl border border-slate-200 bg-card">
                                    <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                                        <CardTitle className="text-xs font-medium text-muted-foreground">
                                            {t(`kpi.${card.key}`)}
                                        </CardTitle>
                                        <card.icon className={`h-4 w-4 ${card.color}`} />
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="text-lg font-bold">
                                            {loading ? (
                                                <Skeleton className="h-6 w-10" />
                                            ) : (
                                                card.value.toLocaleString(locale)
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Sector distribution */}
                        <Card className="rounded-xl border border-slate-200 bg-card">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <PieChart className="h-4 w-4 text-primary" />
                                    {t("sectorTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                {loading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-5 w-full" />
                                        ))}
                                    </div>
                                ) : data.sectorDistribution.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {t("sectorEmpty")}
                                    </p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {data.sectorDistribution.map((slice) => (
                                            <div key={slice.id}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="truncate font-medium">
                                                        {slice.name}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {slice.count}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                                                        style={{
                                                            width: `${Math.round(
                                                                (slice.count / maxSectorCount) * 100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top companies by views */}
                        <Card className="rounded-xl border border-slate-200 bg-card">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    {t("topTitle")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                {loading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-6 w-full" />
                                        ))}
                                    </div>
                                ) : data.topCompanies.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{t("topEmpty")}</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {data.topCompanies.map((company, i) => (
                                            <div
                                                key={company.id}
                                                className="flex items-center justify-between py-1"
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                                                        {i + 1}
                                                    </span>
                                                    <span className="truncate text-sm font-medium">
                                                        {company.name}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            STATUS_BADGE_VARIANT[company.status] ??
                                                            "outline"
                                                        }
                                                        className="shrink-0 text-[10px] capitalize"
                                                    >
                                                        {company.status}
                                                    </Badge>
                                                </div>
                                                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                    <Eye className="h-3 w-3" />
                                                    {company.views.toLocaleString(locale)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
