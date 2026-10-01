"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { PageHeader } from "@/components/design";
import {
  MetricCard,
  MetricCardSkeleton,
  TopSearchEntriesCard,
  NewsFeedCard,
} from "@/components/dashboard/analytics-cards";
import { fetchNewsFeed, type AnalyticsTrend, type TopSearchEntry } from "@/lib/analytics/queries";
import { fetchOwnerDashboardMetrics, type MetricSeries } from "@/lib/dashboard/overview/metrics";

const ANALYTICS_PERIOD = 30;

function SectionSkeleton() {
  return (
    <div className="bg-card border border-slate-200 rounded-xl p-4 animate-pulse space-y-3">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-3 w-48 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-3/4 bg-muted rounded" />
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
    >
      {message}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("Analytics");
  const { user } = useAuth();
  const { data: companies, isLoading: companiesLoading } = useCompanies(user?.id);

  const hasCompanies = (companies ?? []).length > 0;

  // Same source and window as the dashboard home: owners cannot read
  // analytics_events under RLS, so everything comes from the 00052 aggregate.
  const metrics = useQuery({
    queryKey: ["overview", "metrics", user?.id, ANALYTICS_PERIOD],
    queryFn: () => fetchOwnerDashboardMetrics(ANALYTICS_PERIOD),
    enabled: hasCompanies,
  });
  const toTrend = (m: MetricSeries | undefined): AnalyticsTrend =>
    m
      ? {
          total: m.current,
          recent: m.current,
          previous: m.previous,
          changePct: m.previous === 0 ? null : Math.round(((m.current - m.previous) / m.previous) * 100),
        }
      : { total: 0, recent: 0, previous: 0, changePct: null };
  const profileViews = { ...metrics, data: toTrend(metrics.data?.metrics.profile_views) };
  const searchAppearances = { ...metrics, data: toTrend(metrics.data?.metrics.search_appearances) };
  const topSearchEntries = {
    ...metrics,
    data: (metrics.data?.top_search ?? []).map(
      (e): TopSearchEntry => ({
        entityType: e.entity_type,
        entityId: e.entity_id,
        nameEn: e.name_en,
        nameFr: e.name_fr,
        appearances: e.appearances,
      })
    ),
  };

  // News/events feed is public content — independent of company ownership.
  const newsFeed = useQuery({
    queryKey: ["analytics", "news-feed"],
    queryFn: fetchNewsFeed,
  });

  const metricsLoading = companiesLoading || profileViews.isLoading || searchAppearances.isLoading;
  const metricsError = profileViews.isError || searchAppearances.isError;

  const trendLabels = {
    up: (pct: string) => t("trendUp", { pct }),
    down: (pct: string) => t("trendDown", { pct }),
    flat: t("trendFlat"),
    noBaseline: t("trendNoBaseline"),
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {metricsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : metricsError ? (
          <div className="sm:col-span-2">
            <ErrorPanel message={t("error")} />
          </div>
        ) : (
          <>
            <MetricCard
              label={t("profileViews")}
              trend={profileViews.data ?? { total: 0, recent: 0, previous: 0, changePct: null }}
              icon={Eye}
              trendLabels={trendLabels}
            />
            <MetricCard
              label={t("searchAppearances")}
              trend={searchAppearances.data ?? { total: 0, recent: 0, previous: 0, changePct: null }}
              icon={Search}
              trendLabels={trendLabels}
            />
          </>
        )}
      </div>

      {/* Top search entries */}
      {!companiesLoading && topSearchEntries.isLoading ? (
        <SectionSkeleton />
      ) : topSearchEntries.isError ? (
        <ErrorPanel message={t("error")} />
      ) : (
        <TopSearchEntriesCard
          entries={topSearchEntries.data ?? []}
          title={t("topSearchTitle")}
          subtitle={t("topSearchSubtitle")}
          appearancesLabel={(count) => t("appearancesCount", { count })}
          emptyTitle={t("topSearchEmptyTitle")}
          emptyBody={t("topSearchEmptyBody")}
        />
      )}

      {/* News & events feed */}
      {newsFeed.isLoading ? (
        <SectionSkeleton />
      ) : newsFeed.isError ? (
        <ErrorPanel message={t("error")} />
      ) : (
        <NewsFeedCard
          items={newsFeed.data ?? []}
          title={t("newsFeedTitle")}
          subtitle={t("newsFeedSubtitle")}
          newsLabel={t("newsTag")}
          eventLabel={t("eventTag")}
          emptyTitle={t("newsFeedEmptyTitle")}
          emptyBody={t("newsFeedEmptyBody")}
        />
      )}
    </div>
  );
}
