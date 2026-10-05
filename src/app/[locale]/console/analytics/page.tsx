"use client";

import * as React from "react";
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    Users,
    FileText,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/console/page-header";
import { KpiTile, KpiTileSkeleton } from "@/components/dashboard/overview/kpi-tile";

interface PlatformStats {
    totalCompanies: number;
    verifiedCompanies: number;
    pendingCompanies: number;
    rejectedCompanies: number;
    registeredUsers: number;
    activeRfqListings: number;
}

const STAT_CARDS = [
    {
        key: "totalCompanies" as const,
        labelKey: "totalCompanies" as const,
        icon: Building2,
    },
    {
        key: "verifiedCompanies" as const,
        labelKey: "verifiedCompanies" as const,
        icon: CheckCircle,
    },
    {
        key: "pendingCompanies" as const,
        labelKey: "pendingCompanies" as const,
        icon: Clock,
    },
    {
        key: "rejectedCompanies" as const,
        labelKey: "rejectedCompanies" as const,
        icon: XCircle,
    },
    {
        key: "registeredUsers" as const,
        labelKey: "registeredUsers" as const,
        icon: Users,
    },
    {
        key: "activeRfqListings" as const,
        labelKey: "activeRfqListings" as const,
        icon: FileText,
    },
];

export default function AdminAnalyticsPage() {
    const t = useTranslations("Admin.analytics");
    const format = useFormatter();
    const [stats, setStats] = React.useState<PlatformStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = createClient();

                const [companiesRes, usersRes, rfqRes] = await Promise.all([
                    supabase.from("companies").select("status"),
                    supabase.from("profiles").select("id", { count: "exact", head: true }),
                    supabase
                        .from("rfq_listings")
                        .select("id", { count: "exact", head: true })
                        .eq("status", "active"),
                ]);

                if (companiesRes.error) throw companiesRes.error;
                if (usersRes.error) throw usersRes.error;
                if (rfqRes.error) throw rfqRes.error;

                const companies = companiesRes.data ?? [];

                setStats({
                    totalCompanies: companies.length,
                    verifiedCompanies: companies.filter((c) => c.status === "verified").length,
                    pendingCompanies: companies.filter((c) => c.status === "pending").length,
                    rejectedCompanies: companies.filter((c) => c.status === "rejected").length,
                    registeredUsers: usersRes.count ?? 0,
                    activeRfqListings: rfqRes.count ?? 0,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : t("loadError");
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [t]);

    return (
        <div className="space-y-4">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />

            {error ? (
                <p role="alert" className="rounded-2xl bg-red-50 px-5 py-6 text-center text-sm text-red-700">{error}</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {STAT_CARDS.map((card, i) =>
                        loading ? (
                            <KpiTileSkeleton key={card.key} />
                        ) : (
                            <KpiTile
                                key={card.key}
                                highlight={i === 0}
                                icon={card.icon}
                                label={t(card.labelKey)}
                                value={format.number(stats?.[card.key] ?? 0)}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
