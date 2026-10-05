"use client";

import { latestStaffMessage, sortEvents } from "@/lib/verifications/workflow";
import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Eye, MessageCircleReply, MousePointerClick, Package, Plus, Search, Target, Timer } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useAwaitingReplies } from "@/hooks/use-awaiting-replies";
import { useReceivedRequests } from "@/hooks/use-received-requests";
import { HOME_COUNTRY } from "@/config/geo";
import { resolveSectorLabel } from "@/lib/dashboard/company-display";
import type { Locale } from "@/config/locales";
import {
  fetchOwnerDashboardMetrics,
  ratePct,
  ratePointsDelta,
  trendOf,
  type MetricSeries,
  type OverviewPeriod,
} from "@/lib/dashboard/overview/metrics";
import {
  fetchMarketWatch,
  fetchMatchingSuppliers,
  fetchMyOpportunities,
  fetchOwnerContent,
  fetchRecommendedOpportunities,
} from "@/lib/dashboard/overview/queries";
import { profileCompleteness } from "@/lib/dashboard/overview/profile-completeness";
import { buildDashboardTasks } from "@/lib/dashboard/overview/tasks";
import { PeriodSwitch } from "@/components/dashboard/overview/period-switch";
import { KpiTile, KpiTileSkeleton, type KpiDelta } from "@/components/dashboard/overview/kpi-tile";
import { ActionCenter } from "@/components/dashboard/overview/action-center";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { MyOpportunitiesCard, RecommendedOpportunitiesCard } from "@/components/dashboard/overview/opportunity-cards";
import {
  MarketWatchCard,
  SearchDiscoveryCard,
  SuppliersCard,
  TopProductsCard,
} from "@/components/dashboard/overview/insight-cards";
import { OnboardingGuide } from "@/components/dashboard/overview/onboarding-guide";
import { buildOnboarding } from "@/lib/dashboard/overview/onboarding";
import { ActivityChart } from "@/components/dashboard/overview/activity-chart";

interface OverviewCompany {
  id: string;
  name: string;
  status: string;
  country: string | null;
  sector_id: string | null;
  sectors: { name_en: string | null; name_fr: string | null } | { name_en: string | null; name_fr: string | null }[] | null;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  website: string | null;
  certifications: string[] | null;
  markets: string[] | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  verification_summary: unknown;
  verification_reviews: { decision: string; notes: string | null; created_at: string }[] | null;
}

const isHomeCountry = (country: string | null) =>
  // Rows created before 00035 have the DRC as their column default.
  !country || country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();

/** Target provinces an international company declared at registration. */
function targetProvinces(companies: OverviewCompany[]): string[] {
  const all = companies.flatMap((c) => {
    const intake = (c.verification_summary as { registration_intake?: { international?: { target_provinces?: string[] } | null } } | null)
      ?.registration_intake?.international;
    return intake?.target_provinces ?? [];
  });
  return Array.from(new Set(all));
}

/** Status as the task list understands it: a pending file whose last event is a more-info request is the company's turn. */
function taskStatus(c: OverviewCompany): string {
  const reviews = [...(c.verification_reviews ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return c.status === "pending" && reviews[0]?.decision === "more_info_requested" ? "more_info_requested" : c.status;
}

const reviewEvents = (c: OverviewCompany) =>
  (c.verification_reviews ?? []).map((r) => ({ decision: r.decision, notes: r.notes, createdAt: r.created_at }));

/** The team's message attached to its latest decision (not the owner's own sends). */
function latestNotes(c: OverviewCompany): string | null {
  return latestStaffMessage(reviewEvents(c))?.notes ?? null;
}

/** When the company was last approved, if that is its current state. */
function approvedAt(c: OverviewCompany): string | null {
  if (c.status !== "verified") return null;
  return sortEvents(reviewEvents(c)).find((e) => e.decision === "approved")?.createdAt ?? null;
}

export default function DashboardPage() {
  const t = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();
  const { user } = useAuth();
  const { data: rawCompanies, isLoading: companiesLoading } = useCompanies(user?.id);
  const [period, setPeriod] = React.useState<OverviewPeriod>(30);
  const [now] = React.useState(() => new Date());

  const companies = React.useMemo(() => (rawCompanies ?? []) as unknown as OverviewCompany[], [rawCompanies]);
  const companyIds = React.useMemo(() => companies.map((c) => c.id), [companies]);
  const sectorIds = React.useMemo(
    () => Array.from(new Set(companies.map((c) => c.sector_id).filter((id): id is string => !!id))),
    [companies]
  );
  // Same rule as the account type (00051): one company in the DRC makes the owner Congolese.
  const congolese = companies.length === 0 || companies.some((c) => isHomeCountry(c.country));
  const provinces = React.useMemo(() => (congolese ? [] : targetProvinces(companies)), [congolese, companies]);
  const primary = companies[0];
  const hasCompanies = companyIds.length > 0;

  const metrics = useQuery({
    queryKey: ["overview", "metrics", user?.id, period],
    queryFn: () => fetchOwnerDashboardMetrics(period),
    enabled: hasCompanies,
  });
  const content = useQuery({
    queryKey: ["overview", "content", companyIds],
    queryFn: () => fetchOwnerContent(companyIds),
    enabled: hasCompanies,
  });
  const myOpportunities = useQuery({
    queryKey: ["overview", "my-opportunities", companyIds],
    queryFn: () => fetchMyOpportunities(companyIds, user!.id, now),
    enabled: hasCompanies && !!user,
  });
  const recommended = useQuery({
    queryKey: ["overview", "recommended", sectorIds, provinces, companyIds],
    queryFn: () => fetchRecommendedOpportunities({ sectorIds, ownCompanyIds: companyIds, provinces, now }),
    enabled: hasCompanies,
  });
  const suppliers = useQuery({
    queryKey: ["overview", "suppliers", sectorIds, companyIds],
    queryFn: () => fetchMatchingSuppliers({ sectorIds, ownCompanyIds: companyIds, homeCountry: HOME_COUNTRY }),
    enabled: hasCompanies && !congolese,
  });
  const market = useQuery({
    queryKey: ["overview", "market", sectorIds],
    queryFn: () => fetchMarketWatch(sectorIds),
    enabled: hasCompanies && !congolese,
  });

  const awaitingReplies = useAwaitingReplies(user?.id);
  const { unseenCount: newRequests } = useReceivedRequests(user?.id);

  const tasks = React.useMemo(() => {
    if (!hasCompanies) return [];
    const completeness =
      primary && content.data
        ? profileCompleteness({
            ...primary,
            photoCount: content.data.photoCountByCompany[primary.id] ?? 0,
            productCount: content.data.productCountByCompany[primary.id] ?? 0,
          })
        : null;
    return buildDashboardTasks({
      now,
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        status: taskStatus(c),
        latestReviewNotes: latestNotes(c),
        approvedAt: approvedAt(c),
        isPremium: c.is_premium,
        premiumExpiresAt: c.premium_expires_at,
      })),
      awaitingReplies,
      newRequests,
      newResponses: myOpportunities.data?.newResponses ?? 0,
      completeness,
      completenessCompanyId: primary?.id,
    });
  }, [hasCompanies, primary, content.data, companies, awaitingReplies, newRequests, myOpportunities.data, now]);

  // Getting-started path; null until the product count is known, so a step never flashes as "to do".
  const onboarding = React.useMemo(() => {
    if (!hasCompanies) return buildOnboarding({ companies: [], productCount: 0 });
    if (!content.data) return null;
    const productCount = Object.values(content.data.productCountByCompany).reduce((a, b) => a + b, 0);
    return buildOnboarding({ companies: companies.map((c) => ({ id: c.id, status: c.status })), productCount });
  }, [hasCompanies, content.data, companies]);

  if (!user) {
    return <p className="py-10 text-center text-sm text-slate-500">{t("signInRequired")}</p>;
  }

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? user.email?.split("@")[0] ?? "";
  const n = (value: number) => format.number(value);
  const pct = (value: number) => format.number(value / 100, { style: "percent", maximumFractionDigits: 1 });

  const countDelta = (m: MetricSeries): KpiDelta => {
    const trend = trendOf(m.current, m.previous);
    return {
      direction: trend.direction,
      text: trend.direction === "new" ? t("deltaNew") : trend.direction === "flat" ? t("deltaFlat") : pct(trend.pct ?? 0),
    };
  };
  const seriesOf = (m: MetricSeries) => ({ values: m.series, startDate: metrics.data!.current_start });

  const renderKpis = () => {
    if (metrics.isError) {
      return (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 sm:col-span-2">
          {t("metricsError")}
          <button type="button" onClick={() => metrics.refetch()} className="font-semibold underline">
            {t("retry")}
          </button>
        </div>
      );
    }
    if (!metrics.data) return Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />);

    const m = metrics.data.metrics;
    if (congolese) {
      const rateNow = ratePct(m.contact_requests.current, m.profile_views.current);
      const ratePrev = ratePct(m.contact_requests.previous, m.profile_views.previous);
      const points = ratePointsDelta(rateNow, ratePrev);
      return (
        <>
          <KpiTile highlight icon={Eye} label={t("kpi.profileViews")} value={n(m.profile_views.current)} delta={countDelta(m.profile_views)} series={seriesOf(m.profile_views)} />
          <KpiTile icon={Search} label={t("kpi.searchAppearances")} value={n(m.search_appearances.current)} delta={countDelta(m.search_appearances)} series={seriesOf(m.search_appearances)} />
          <KpiTile icon={Package} label={t("kpi.productViews")} value={n(m.product_views.current)} delta={countDelta(m.product_views)} series={seriesOf(m.product_views)} />
          <KpiTile
            icon={MousePointerClick}
            label={t("kpi.contactRate")}
            value={rateNow === null ? "—" : pct(rateNow)}
            delta={
              points === null
                ? null
                : {
                    direction: points > 0 ? "up" : points < 0 ? "down" : "flat",
                    text: t("deltaPoints", { value: format.number(Math.abs(points), { maximumFractionDigits: 1 }) }),
                  }
            }
            footnote={
              rateNow === null
                ? t("kpi.contactRateNoViews")
                : t("kpi.contactRateFoot", { contacts: m.contact_requests.current, views: m.profile_views.current })
            }
          />
        </>
      );
    }

    const outreach = metrics.data.outreach;
    const replyRate = ratePct(outreach.replied, outreach.started);
    return (
      <>
        <KpiTile highlight icon={MessageCircleReply} label={t("kpi.responsesReceived")} value={n(m.responses_received.current)} delta={countDelta(m.responses_received)} series={seriesOf(m.responses_received)} />
        <KpiTile icon={Target} label={t("kpi.matchingOpportunities")} value={recommended.data ? n(recommended.data.total) : "—"} footnote={t("kpi.matchingFoot")} />
        <KpiTile icon={Eye} label={t("kpi.profileViewsYours")} value={n(m.profile_views.current)} delta={countDelta(m.profile_views)} series={seriesOf(m.profile_views)} />
        <KpiTile
          icon={Timer}
          label={t("kpi.replyRate")}
          value={replyRate === null ? "—" : pct(replyRate)}
          footnote={
            replyRate === null
              ? t("kpi.replyNone")
              : outreach.median_reply_hours === null
                ? t("kpi.replyCount", { replied: outreach.replied, started: outreach.started })
                : t("kpi.replyMedian", { hours: format.number(outreach.median_reply_hours, { maximumFractionDigits: 1 }) })
          }
        />
      </>
    );
  };

  const sectorLabel = primary ? resolveSectorLabel(primary.sectors, locale as Locale) : null;
  const hour = now.getHours();
  const greetingKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const chart = metrics.data ? (
    <ActivityChart
      title={t(congolese ? "chart.titleVitrine" : "chart.titleProfile")}
      subtitle={t("periodCompare", { days: period })}
      startDate={metrics.data.current_start}
      series={
        congolese
          ? [
              { key: "profile", label: t("kpi.profileViews"), color: "blue", values: metrics.data.metrics.profile_views.series },
              { key: "products", label: t("kpi.productViews"), color: "gold", hatched: true, values: metrics.data.metrics.product_views.series },
            ]
          : [{ key: "profile", label: t("kpi.profileViewsYours"), color: "blue", values: metrics.data.metrics.profile_views.series }]
      }
    />
  ) : (
    <CardSkeleton rows={6} />
  );

  return (
    <div className="mx-auto max-w-[1320px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[32px]">
            {t(`greetingTime.${greetingKey}`, { name: firstName })}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {hasCompanies ? t("greetingSub", { company: primary!.name, days: period }) : t("greetingNewSub")}
          </p>
        </div>
        {hasCompanies && (
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSwitch value={period} onChange={setPeriod} />
            <Link
              href={congolese ? "/dashboard/products/new" : "/dashboard/opportunities/new"}
              className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-market-or text-market-navy">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </span>
              {t(congolese ? "ctaOffer" : "ctaRequest")}
            </Link>
          </div>
        )}
      </header>

      {companiesLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />)}
        </div>
      ) : !hasCompanies ? (
        <OnboardingGuide model={onboarding!} variant="welcome" />
      ) : (
        <>
          {onboarding && !onboarding.complete && <OnboardingGuide model={onboarding} variant="progress" />}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <section aria-label={t(congolese ? "visibilityTitle" : "activityTitle")} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
              {renderKpis()}
            </section>
            <div className="min-w-0 xl:col-span-5">
              <ActionCenter tasks={tasks} userId={user.id} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">{chart}</div>
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
              {congolese ? (
                <>
                  {metrics.data ? <TopProductsCard products={metrics.data.top_products} /> : <CardSkeleton rows={3} />}
                  {metrics.data ? <SearchDiscoveryCard entries={metrics.data.top_search} /> : <CardSkeleton rows={2} />}
                </>
              ) : (
                <>
                  {market.data ? <MarketWatchCard data={market.data} /> : <CardSkeleton rows={3} />}
                  {suppliers.data ? <SuppliersCard suppliers={suppliers.data} /> : <CardSkeleton rows={3} />}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {congolese ? (
              <>
                <div className="min-w-0 xl:col-span-8">
                  {myOpportunities.data ? <MyOpportunitiesCard data={myOpportunities.data} wording="offers" /> : <CardSkeleton />}
                </div>
                <div className="min-w-0 xl:col-span-4">
                  {recommended.data ? (
                    <RecommendedOpportunitiesCard data={recommended.data} sectorLabel={sectorLabel} provinces={[]} layout="list" />
                  ) : (
                    <CardSkeleton />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="min-w-0 xl:col-span-8">
                  {recommended.data ? (
                    <RecommendedOpportunitiesCard data={recommended.data} sectorLabel={sectorLabel} provinces={provinces} layout="table" />
                  ) : (
                    <CardSkeleton />
                  )}
                </div>
                <div className="min-w-0 xl:col-span-4">
                  {myOpportunities.data ? <MyOpportunitiesCard data={myOpportunities.data} wording="requests" compact /> : <CardSkeleton />}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
