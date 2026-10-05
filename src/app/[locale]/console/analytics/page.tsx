"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, CircleHelp, Forward, Hourglass, ShieldCheck, Timer, Users, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/components/console/page-header";
import type { OverviewPeriod } from "@/lib/dashboard/overview/metrics";
import { funnelSteps } from "@/lib/dashboard/analytics/details";
import {
    SEGMENT_FUNNEL_STEPS,
    fetchConsoleUserTypeMetrics,
    type ConsoleUserTypeMetrics,
    type SegmentKey,
} from "@/lib/console/user-type-metrics";
import { PeriodSwitch } from "@/components/dashboard/overview/period-switch";
import { CardSkeleton, OverviewCard } from "@/components/dashboard/overview/overview-card";
import { ActivityChart } from "@/components/dashboard/overview/activity-chart";
import {
    FigureList,
    FunnelCard,
    MeterList,
    SectionHeading,
    StatsHero,
    StatsHeroSkeleton,
} from "@/components/dashboard/analytics/stat-blocks";
import { SegmentCompare, TeamCard, UserTypeTiles } from "@/components/console/analytics/user-type-cards";

/**
 * Staff console Statistics: the platform read by type of user. The console
 * home answers "what waits on us and what happened"; this page answers "who is
 * on the platform and how far each kind of user gets". The opening band is
 * written for the reader's role: growth for a super-admin, workload for a
 * moderator.
 */
export default function ConsoleAnalyticsPage() {
    const t = useTranslations("Admin.analytics");
    const tOverview = useTranslations("DashboardOverview");
    const format = useFormatter();
    const [period, setPeriod] = React.useState<OverviewPeriod>(30);
    const [data, setData] = React.useState<ConsoleUserTypeMetrics | null>(null);
    const [error, setError] = React.useState(false);
    const [attempt, setAttempt] = React.useState(0);

    React.useEffect(() => {
        let cancelled = false;
        fetchConsoleUserTypeMetrics(period)
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
    const share = (value: number) => format.number(value, { style: "percent", maximumFractionDigits: 0 });
    const duration = (hours: number | null) =>
        hours === null
            ? "—"
            : hours < 48
              ? t("hours", { value: format.number(hours, { maximumFractionDigits: 1 }) })
              : t("days", { value: format.number(hours / 24, { maximumFractionDigits: 1 }) });

    const renderHero = (d: ConsoleUserTypeMetrics) => {
        const { drc, intl } = d.segments;
        const companies = drc.companies + intl.companies;
        const verified = drc.funnel.verified + intl.funnel.verified;
        const members = d.accounts.congolese.total + d.accounts.international.total + d.accounts.none.total;
        const active = d.accounts.congolese.active + d.accounts.international.active + d.accounts.none.active;
        const decisions = d.moderation.approved + d.moderation.rejected + d.moderation.more_info;

        if (d.viewer_role === "super_admin") {
            return (
                <StatsHero
                    icon={ShieldCheck}
                    eyebrow={t("hero.eyebrow", { role: t("roles.super_admin"), days: d.period_days })}
                    headline={t("hero.superAdmin.headline", { accounts: members, companies, verified })}
                    body={t("hero.superAdmin.body")}
                    readings={[
                        {
                            key: "active",
                            label: t("hero.superAdmin.active"),
                            value: n(active),
                            note: members > 0 ? t("hero.superAdmin.activeNote", { percent: share(active / members) }) : undefined,
                        },
                        {
                            key: "new",
                            label: t("hero.superAdmin.newCompanies"),
                            value: n(drc.new_current + intl.new_current),
                            note: t("hero.superAdmin.newCompaniesNote", { count: drc.new_previous + intl.new_previous }),
                        },
                        {
                            key: "premium",
                            label: t("hero.superAdmin.premium"),
                            value: n(drc.premium + intl.premium),
                            note: companies > 0 ? t("hero.superAdmin.premiumNote", { percent: share((drc.premium + intl.premium) / companies) }) : undefined,
                        },
                    ]}
                />
            );
        }
        return (
            <StatsHero
                icon={ShieldCheck}
                eyebrow={t("hero.eyebrow", { role: t("roles.moderator"), days: d.period_days })}
                headline={t("hero.moderator.headline", { decisions, waiting: d.moderation.requests_waiting })}
                body={t("hero.moderator.body")}
                readings={[
                    {
                        key: "decisions",
                        label: t("hero.moderator.decisions"),
                        value: n(decisions),
                        note: t("hero.moderator.decisionsNote", { approved: d.moderation.approved }),
                    },
                    { key: "delay", label: t("hero.moderator.delay"), value: duration(d.moderation.median_decision_hours), note: t("hero.moderator.delayNote") },
                    {
                        key: "waiting",
                        label: t("hero.moderator.waiting"),
                        value: n(d.moderation.requests_waiting),
                        note: t("hero.moderator.waitingNote", { count: d.moderation.requests_forwarded }),
                    },
                ]}
            />
        );
    };

    const renderFunnel = (d: ConsoleUserTypeMetrics, key: SegmentKey) => (
        <FunnelCard
            id={`console-stats-funnel-${key}`}
            title={t(`funnel.title.${key}`)}
            subtitle={t("funnel.subtitle")}
            color={key === "drc" ? "blue" : "gold"}
            formatNumber={n}
            shareLabel={(s) => t("funnel.share", { percent: share(s) })}
            empty={t(`funnel.empty.${key}`)}
            steps={funnelSteps(SEGMENT_FUNNEL_STEPS.map((step) => ({ key: step, value: d.segments[key].funnel[step] }))).map((s) => ({
                ...s,
                label: t(`funnel.steps.${s.key}`),
            }))}
        />
    );

    const renderBody = (d: ConsoleUserTypeMetrics) => {
        const kinds = ["congolese", "international", "none"] as const;
        const signups = d.signups.with_company.reduce((a, b) => a + b, 0) + d.signups.without_company.reduce((a, b) => a + b, 0);
        return (
            <>
                {renderHero(d)}

                <SectionHeading id="console-stats-types" title={t("sections.types.title")} hint={t("sections.types.hint")} />
                <section aria-labelledby="console-stats-types">
                    <UserTypeTiles data={d} />
                </section>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="min-w-0 xl:col-span-8">
                        <ActivityChart
                            title={t("signups.title")}
                            subtitle={tOverview("periodCompare", { days: d.period_days })}
                            startDate={d.current_start}
                            totalLabel={t("signups.total", { count: signups })}
                            series={[
                                { key: "with", label: t("signups.withCompany"), color: "blue", values: d.signups.with_company },
                                { key: "without", label: t("signups.withoutCompany"), color: "gold", hatched: true, values: d.signups.without_company },
                            ]}
                        />
                    </div>
                    <div className="min-w-0 xl:col-span-4">
                        <OverviewCard id="console-stats-active" title={t("activity.title")} subtitle={t("activity.subtitle")} className="h-full">
                            <MeterList
                                items={kinds.map((kind) => ({
                                    key: kind,
                                    label: t(`types.${kind}.label`),
                                    value: d.accounts[kind].active,
                                    total: d.accounts[kind].total,
                                    valueText: t("activity.ratio", { active: n(d.accounts[kind].active), total: n(d.accounts[kind].total) }),
                                }))}
                            />
                            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">{t("activity.note")}</p>
                        </OverviewCard>
                    </div>
                </div>

                <SectionHeading title={t("sections.companies.title")} hint={t("sections.companies.hint")} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="min-w-0">{renderFunnel(d, "drc")}</div>
                    <div className="min-w-0">{renderFunnel(d, "intl")}</div>
                </div>
                <SegmentCompare segments={d.segments} />

                <SectionHeading title={t("sections.team.title")} hint={t(`sections.team.hint.${d.viewer_role}`)} />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="min-w-0 xl:col-span-5">
                        <OverviewCard
                            id="console-stats-moderation"
                            title={t("moderation.title")}
                            subtitle={t("moderation.subtitle")}
                            footerLink={{ href: ROUTES.CONSOLE_VERIFICATIONS, label: t("moderation.link") }}
                            className="h-full"
                        >
                            <FigureList
                                items={[
                                    { key: "approved", icon: CheckCircle2, label: t("moderation.approved"), value: n(d.moderation.approved) },
                                    { key: "moreInfo", icon: CircleHelp, label: t("moderation.moreInfo"), value: n(d.moderation.more_info) },
                                    { key: "rejected", icon: XCircle, label: t("moderation.rejected"), value: n(d.moderation.rejected) },
                                    { key: "delay", icon: Timer, label: t("moderation.delay"), note: t("moderation.delayNote"), value: duration(d.moderation.median_decision_hours) },
                                    { key: "forwarded", icon: Forward, label: t("moderation.forwarded"), value: n(d.moderation.requests_forwarded) },
                                    { key: "waiting", icon: Hourglass, label: t("moderation.waiting"), note: t("moderation.waitingNote"), value: n(d.moderation.requests_waiting) },
                                ]}
                            />
                        </OverviewCard>
                    </div>
                    <div className="min-w-0 xl:col-span-7">
                        <TeamCard team={d.team} viewerRole={d.viewer_role} />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
                            <Users className="h-3.5 w-3.5 text-market-navy" aria-hidden />
                            {t("byUserType")}
                        </span>
                        <PeriodSwitch value={period} onChange={setPeriod} />
                    </div>
                }
            />

            {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                    {t("loadError")}
                    <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline">
                        {tOverview("retry")}
                    </button>
                </div>
            )}

            {!data ? (
                !error && (
                    <>
                        <StatsHeroSkeleton />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} rows={4} />)}
                        </div>
                        <CardSkeleton rows={8} />
                    </>
                )
            ) : (
                <div className={cn("space-y-5 transition-opacity duration-150", stale && "opacity-60")} aria-busy={stale}>
                    {renderBody(data)}
                </div>
            )}
        </div>
    );
}
