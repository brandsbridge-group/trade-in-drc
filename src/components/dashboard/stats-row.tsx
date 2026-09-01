"use client";

import { useTranslations } from "next-intl";
import { useAnalytics } from "@/hooks/use-analytics";

interface StatsRowProps {
    companyIds: string[];
}

interface StatItemProps {
    label: string;
    value: number | string;
    hasBorderRight?: boolean;
}

function StatItem({ label, value, hasBorderRight = true }: StatItemProps) {
    return (
        <div className={`flex flex-col px-4 py-2 ${hasBorderRight ? "border-r" : ""}`}>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className="text-lg font-bold">{value}</span>
        </div>
    );
}

export function StatsRow({ companyIds }: StatsRowProps) {
    const t = useTranslations("Analytics");
    const { data, isLoading } = useAnalytics(companyIds);

    const profileViews = isLoading ? "—" : (data?.profileViews ?? 0);
    const productViews = isLoading ? "—" : (data?.productViews ?? 0);
    const contactRequests = isLoading ? "—" : (data?.contactRequests ?? 0);

    return (
        <div className="flex items-center bg-slate-50 rounded-md border w-fit">
            <StatItem label={t("profileViews")} value={profileViews} />
            <StatItem label={t("productViews")} value={productViews} />
            <StatItem label={t("contactRequests")} value={contactRequests} hasBorderRight={false} />
        </div>
    );
}
