"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Building2, Eye, Handshake, Package, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/console/page-header";
import { trendOf, type MetricSeries, type OverviewPeriod } from "@/lib/dashboard/overview/metrics";
import {
    fetchConsoleDashboardMetrics,
    sumMetrics,
    type ConsoleDashboardMetrics,
} from "@/lib/console/dashboard-metrics";
import { PeriodSwitch } from "@/components/dashboard/overview/period-switch";
import { KpiTile, KpiTileSkeleton, type KpiDelta } from "@/components/dashboard/overview/kpi-tile";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { ActivityChart, type ChartSeries } from "@/components/dashboard/overview/activity-chart";
import { ModerationQueue } from "@/components/console/dashboard/moderation-queue";
import { VerificationFunnel } from "@/components/console/dashboard/verification-funnel";
import {
    CategoriesCard,
    OriginCard,
    PremiumCard,
    SectorsCard,
    TopCompaniesCard,
} from "@/components/console/dashboard/insight-cards";

/** The three readings of the activity chart: demand, supply, and the two meeting. */
const CHART_VIEWS = ["traffic", "signups", "connections"] as const;
type ChartView = (typeof CHART_VIEWS)[number];

/**
 * Staff console home. Top to bottom: what waits on the team, what the platform
 * produced over the period, then how the marketplace is made up.
 */
export default function ConsoleDashboardPage() {
    const t = useTranslations("Admin.dashboard");
    const tOverview = useTranslations("DashboardOverview");
    const format = useFormatter();
    const [period, setPeriod] = React.useState<OverviewPeriod>(30);
    const [view, setView] = React.useState<ChartView>("traffic");
    const [data, setData] = React.useState<ConsoleDashboardMetrics | null>(null);
    const [error, setError] = React.useState(false);
    const [attempt, setAttempt] = React.useState(0);
    const [now] = React.useState(() => new Date());

    React.useEffect(() => {
        let cancelled = false;
        fetchConsoleDashboardMetrics(period)
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setError(false);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [period, attempt]);

    // While another period loads, the previous numbers stay on screen, dimmed.
    const stale = data !== null && data.period_days !== period;
    const n = (value: number) => format.number(value);

    const countDelta = (m: MetricSeries): KpiDelta => {
        const trend = trendOf(m.current, m.previous);
        return {
            direction: trend.direction,
            text:
                trend.direction === "new"
                    ? tOverview("deltaNew")
                    : trend.direction === "flat"
                      ? tOverview("deltaFlat")
                      : format.number((trend.pct ?? 0) / 100, { style: "percent", maximumFractionDigits: 0 }),
        };
    };

    const renderKpis = (d: ConsoleDashboardMetrics) => {
        const m = d.metrics;
        const seriesOf = (s: MetricSeries) => ({ values: s.series, startDate: d.current_start });
        const companies = sumMetrics(m.companies_drc, m.companies_intl);
        const views = sumMetrics(m.profile_views, m.product_views);
        const connections = sumMetrics(m.conversations, m.responses);
        return (
            <>
                <KpiTile
                    highlight
                    icon={Building2}
                    label={t("kpi.companies")}
                    value={n(companies.current)}
                    delta={countDelta(companies)}
                    series={seriesOf(companies)}
                    footnote={t("kpi.companiesFoot", { total: d.funnel.registered, verified: d.funnel.verified })}
                />
                <KpiTile
                    icon={Package}
                    label={t("kpi.products")}
                    value={n(m.products.current)}
                    delta={countDelta(m.products)}
                    series={seriesOf(m.products)}
                    footnote={t("kpi.productsFoot", { published: d.totals.products_published, total: d.totals.products })}
                />
                <KpiTile
                    icon={Eye}
                    label={t("kpi.views")}
                    value={n(views.current)}
                    delta={countDelta(views)}
                    series={seriesOf(views)}
                    footnote={t("kpi.viewsFoot", { count: m.search_appearances.current })}
                />
                <KpiTile
                    icon={Handshake}
                    label={t("kpi.connections")}
                    value={n(connections.current)}
                    delta={countDelta(connections)}
                    series={seriesOf(connections)}
                    footnote={t("kpi.connectionsFoot", {
                        conversations: m.conversations.current,
                        responses: m.responses.current,
                    })}
                />
            </>
        );
    };

    const chartSeries = (d: ConsoleDashboardMetrics): ChartSeries[] => {
        const m = d.metrics;
        const pair: Record<ChartView, [keyof typeof m, keyof typeof m]> = {
            traffic: ["profile_views", "product_views"],
            signups: ["companies_drc", "companies_intl"],
            connections: ["conversations", "responses"],
        };
        const [first, second] = pair[view];
        return [
            { key: first, label: t(`chart.series.${first}`), color: "blue", values: m[first].series },
            { key: second, label: t(`chart.series.${second}`), color: "gold", hatched: true, values: m[second].series },
        ];
    };

    const viewSwitch = (
        <div role="group" aria-label={t("chart.viewLabel")} className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {CHART_VIEWS.map((key) => (
                <button
                    key={key}
                    type="button"
                    aria-pressed={view === key}
                    onClick={() => setView(key)}
                    className={cn(
                        "rounded-md px-3 py-1 text-xs transition-colors",
                        view === key
                            ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200"
                            : "text-slate-500 hover:text-market-navy"
                    )}
                >
                    {t(`chart.views.${key}`)}
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle", { days: period })}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <PeriodSwitch value={period} onChange={setPeriod} />
                        <Link
                            href={ROUTES.CONSOLE_VERIFICATIONS}
                            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
                        >
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-market-or text-market-navy">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            </span>
                            {t("reviewCta")}
                        </Link>
                    </div>
                }
            />

            {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                    {t("loadError")}
                    <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline">
                        {t("retry")}
                    </button>
                </div>
            )}

            {!data ? (
                !error && (
                    <>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
                                {Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />)}
                            </div>
                            <div className="xl:col-span-5"><CardSkeleton rows={6} /></div>
                        </div>
                        <CardSkeleton rows={8} />
                    </>
                )
            ) : (
                <div className={cn("space-y-4 transition-opacity duration-150", stale && "opacity-60")} aria-busy={stale}>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <section aria-label={t("kpi.label")} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
                            {renderKpis(data)}
                        </section>
                        <div className="min-w-0 xl:col-span-5">
                            <ModerationQueue queue={data.queue} now={now} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="min-w-0 xl:col-span-8">
                            <ActivityChart
                                title={t(`chart.titles.${view}`)}
                                subtitle={tOverview("periodCompare", { days: data.period_days })}
                                startDate={data.current_start}
                                series={chartSeries(data)}
                                totalLabel={t(`chart.totals.${view}`)}
                                activeDaysLabel={t(`chart.activeDays.${view}`)}
                                controls={viewSwitch}
                            />
                        </div>
                        <div className="min-w-0 xl:col-span-4">
                            <VerificationFunnel funnel={data.funnel} reviews={data.reviews} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <CategoriesCard categories={data.categories} />
                        <SectorsCard sectors={data.sectors} />
                        <OriginCard origin={data.origin} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="min-w-0 xl:col-span-7">
                            <TopCompaniesCard companies={data.top_companies} />
                        </div>
                        <div className="min-w-0 xl:col-span-5">
                            <PremiumCard premium={data.premium} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
