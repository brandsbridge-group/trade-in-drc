"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    Users,
    FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/design";

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
        color: "text-primary",
    },
    {
        key: "verifiedCompanies" as const,
        labelKey: "verifiedCompanies" as const,
        icon: CheckCircle,
        color: "text-green-600",
    },
    {
        key: "pendingCompanies" as const,
        labelKey: "pendingCompanies" as const,
        icon: Clock,
        color: "text-amber-500",
    },
    {
        key: "rejectedCompanies" as const,
        labelKey: "rejectedCompanies" as const,
        icon: XCircle,
        color: "text-destructive",
    },
    {
        key: "registeredUsers" as const,
        labelKey: "registeredUsers" as const,
        icon: Users,
        color: "text-blue-600",
    },
    {
        key: "activeRfqListings" as const,
        labelKey: "activeRfqListings" as const,
        icon: FileText,
        color: "text-indigo-600",
    },
];

export default function AdminAnalyticsPage() {
    const t = useTranslations("Admin.analytics");
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
        <div className="p-4">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />

            {error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {STAT_CARDS.map((card) => (
                        <Card key={card.key} className="p-0">
                            <CardContent className="p-3">
                                {loading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-7 w-12" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                                            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                                                {t(card.labelKey)}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {stats?.[card.key] ?? 0}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
