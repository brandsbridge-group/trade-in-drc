"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Eye,
  Globe2,
  Inbox,
  MessageCircleReply,
  MessagesSquare,
  MousePointerClick,
  Package,
  Plus,
  Search,
  Send,
  Store,
  Timer,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { HOME_COUNTRY } from "@/config/geo";
import { cn } from "@/lib/utils";
import {
  fetchOwnerDashboardMetrics,
  ratePct,
  trendOf,
  type MetricSeries,
  type OverviewPeriod,
  type OwnerDashboardMetrics,
} from "@/lib/dashboard/overview/metrics";
import {
  fetchOwnerAnalyticsDetails,
  funnelSteps,
  sumSeries,
  weekdayTotals,
  type OwnerAnalyticsDetails,
} from "@/lib/dashboard/analytics/details";
import { PeriodSwitch } from "@/components/dashboard/overview/period-switch";
import { KpiTile, KpiTileSkeleton, type KpiDelta } from "@/components/dashboard/overview/kpi-tile";
import { CardSkeleton, EmptyHint, OverviewCard } from "@/components/dashboard/overview/overview-card";
import { ActivityChart, type ChartSeries } from "@/components/dashboard/overview/activity-chart";
import { BarList } from "@/components/console/dashboard/bar-list";
import {
  FigureList,
  FunnelCard,
  MeterList,
  SectionHeading,
  SegmentedSwitch,
  StatsHero,
  StatsHeroSkeleton,
  WeekdayCard,
} from "@/components/dashboard/analytics/stat-blocks";

const CHART_VIEWS = ["visibility", "interest"] as const;
type ChartView = (typeof CHART_VIEWS)[number];

/** 2024-01-01 is a Monday: seven reference days to name the days of the week in any locale. */
const WEEK = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)));

// Same rule as the account type (00051); rows created before 00035 default to the DRC.
const isHomeCountry = (country: string | null | undefined) =>
  !country || country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();

/**
 * Company Statistics. The same building blocks for every account, ordered and
 * worded for who is reading: a Congolese company reads how buyers find and
 * contact it; an international company reads how its prospecting in the DRC
 * is going.
 */
export default function AnalyticsPage() {
  const t = useTranslations("OwnerStats");
  const tOverview = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();
  const { user } = useAuth();
  const { data: companies, isLoading: companiesLoading } = useCompanies(user?.id);
  const [period, setPeriod] = React.useState<OverviewPeriod>(30);
  const [viewChoice, setViewChoice] = React.useState<ChartView | null>(null);

  const list = (companies ?? []) as unknown as { country: string | null }[];
  const hasCompanies = list.length > 0;
  const seller = list.some((c) => isHomeCountry(c.country));
  const audience = seller ? "seller" : "buyer";
  const view = viewChoice ?? (seller ? "visibility" : "interest");

  // Same cache entry as the dashboard home: owners cannot read analytics_events
  // under RLS, so every figure comes from the two aggregates.
  const metrics = useQuery({
    queryKey: ["overview", "metrics", user?.id, period],
    queryFn: () => fetchOwnerDashboardMetrics(period),
    enabled: hasCompanies,
    placeholderData: (previous) => previous,
  });
  const details = useQuery({
    queryKey: ["owner-stats", "details", user?.id, period],
    queryFn: () => fetchOwnerAnalyticsDetails(period),
    enabled: hasCompanies,
    placeholderData: (previous) => previous,
  });

  const n = (value: number) => format.number(value);
  const share = (value: number, digits = 0) => format.number(value, { style: "percent", maximumFractionDigits: digits });
  const duration = (hours: number | null) =>
    hours === null
      ? "—"
      : hours < 48
        ? t("hours", { value: format.number(hours, { maximumFractionDigits: 1 }) })
        : t("days", { value: format.number(hours / 24, { maximumFractionDigits: 1 }) });
  const localized = (en: string | null, fr: string | null, fallback = "—") =>
    (locale === "fr" ? fr ?? en : en ?? fr) ?? fallback;

  const countDelta = (m: MetricSeries): KpiDelta => {
    const trend = trendOf(m.current, m.previous);
    return {
      direction: trend.direction,
      text:
        trend.direction === "new"
          ? tOverview("deltaNew")
          : trend.direction === "flat"
            ? tOverview("deltaFlat")
            : share((trend.pct ?? 0) / 100),
    };
  };

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[32px]">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{hasCompanies ? t(`subtitle.${audience}`) : t("subtitle.none")}</p>
      </div>
      {hasCompanies && <PeriodSwitch value={period} onChange={setPeriod} />}
    </header>
  );

  if (companiesLoading) {
    return (
      <div className="mx-auto max-w-[1320px] space-y-5">
        {header}
        <StatsHeroSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!hasCompanies) {
    return (
      <div className="mx-auto max-w-[1320px] space-y-5">
        {header}
        <section className="flex flex-col items-start gap-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-market-navy">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-market-navy">{t("noCompany.title")}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">{t("noCompany.body")}</p>
          </div>
          <Link
            href="/dashboard/companies/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-market-or text-market-navy">
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </span>
            {t("noCompany.cta")}
          </Link>
        </section>
      </div>
    );
  }

  const failed = metrics.isError || details.isError;
  const data = metrics.data && details.data ? { m: metrics.data, d: details.data } : null;
  const stale = !!data && (data.m.period_days !== period || data.d.period_days !== period);

  return (
    <div className="mx-auto max-w-[1320px] space-y-5">
      {header}

      {failed && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {t("error")}
          <button
            type="button"
            onClick={() => {
              metrics.refetch();
              details.refetch();
            }}
            className="font-semibold underline"
          >
            {tOverview("retry")}
          </button>
        </div>
      )}

      {!data ? (
        !failed && (
          <>
            <StatsHeroSkeleton />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />)}
            </div>
            <CardSkeleton rows={8} />
          </>
        )
      ) : (
        // While another period loads, the previous numbers stay on screen, dimmed.
        <div className={cn("space-y-5 transition-opacity duration-150", stale && "opacity-60")} aria-busy={stale}>
          {renderBody(data.m, data.d)}
        </div>
      )}
    </div>
  );

  function renderBody(m: OwnerDashboardMetrics, d: OwnerAnalyticsDetails) {
    const k = m.metrics;
    const seriesOf = (s: MetricSeries) => ({ values: s.series, startDate: m.current_start });
    const views = k.profile_views.current + k.product_views.current;
    const contactRate = ratePct(k.contact_requests.current, views);
    const replyRate = m.outreach.started > 0 ? m.outreach.replied / m.outreach.started : null;
    const answerRate = d.inbound.received > 0 ? d.inbound.replied / d.inbound.received : null;
    const days = m.period_days;

    /* ---- Summary band ---------------------------------------------------- */
    const hero = seller ? (
      <StatsHero
        icon={Store}
        eyebrow={t("eyebrow", { account: t("account.seller"), days })}
        headline={views === 0 ? t("hero.seller.empty") : t("hero.seller.headline", { visitors: d.audience.visitors, views })}
        body={t("hero.seller.body")}
        readings={[
          {
            key: "visitors",
            label: t("hero.seller.visitors"),
            value: n(d.audience.visitors),
            note: t("hero.seller.visitorsNote", { count: d.audience.visitors_previous }),
          },
          {
            key: "repeat",
            label: t("hero.seller.repeat"),
            value: n(d.audience.repeat_visitors),
            note: d.audience.visitors > 0 ? t("hero.seller.repeatNote", { percent: share(d.audience.repeat_visitors / d.audience.visitors) }) : undefined,
          },
          {
            key: "rate",
            label: t("hero.seller.contactRate"),
            value: contactRate === null ? "—" : share(contactRate / 100, 1),
            note: t("hero.seller.contactRateNote", { contacts: k.contact_requests.current, views }),
          },
        ]}
      />
    ) : (
      <StatsHero
        icon={Globe2}
        eyebrow={t("eyebrow", { account: t("account.buyer"), days })}
        headline={
          m.outreach.started === 0
            ? t("hero.buyer.empty")
            : t("hero.buyer.headline", { replied: m.outreach.replied, started: m.outreach.started })
        }
        body={t("hero.buyer.body")}
        readings={[
          { key: "started", label: t("hero.buyer.started"), value: n(m.outreach.started), note: t("hero.buyer.startedNote") },
          {
            key: "rate",
            label: t("hero.buyer.replyRate"),
            value: replyRate === null ? "—" : share(replyRate),
            note: t("hero.buyer.replyRateNote", { replied: m.outreach.replied, started: m.outreach.started }),
          },
          { key: "median", label: t("hero.buyer.median"), value: duration(m.outreach.median_reply_hours), note: t("hero.buyer.medianNote") },
        ]}
      />
    );

    /* ---- KPI row ----------------------------------------------------------- */
    const kpis = seller ? (
      <>
        <KpiTile icon={Eye} label={tOverview("kpi.profileViews")} value={n(k.profile_views.current)} delta={countDelta(k.profile_views)} series={seriesOf(k.profile_views)} />
        <KpiTile icon={Package} label={tOverview("kpi.productViews")} value={n(k.product_views.current)} delta={countDelta(k.product_views)} series={seriesOf(k.product_views)} />
        <KpiTile icon={Search} label={tOverview("kpi.searchAppearances")} value={n(k.search_appearances.current)} delta={countDelta(k.search_appearances)} series={seriesOf(k.search_appearances)} />
        <KpiTile icon={MousePointerClick} label={t("kpi.contactRequests")} value={n(k.contact_requests.current)} delta={countDelta(k.contact_requests)} series={seriesOf(k.contact_requests)} />
      </>
    ) : (
      <>
        <KpiTile icon={MessageCircleReply} label={tOverview("kpi.responsesReceived")} value={n(k.responses_received.current)} delta={countDelta(k.responses_received)} series={seriesOf(k.responses_received)} />
        <KpiTile icon={Send} label={t("kpi.responsesSent")} value={n(d.opportunities.sent)} footnote={t("kpi.responsesSentFoot")} />
        <KpiTile icon={MessagesSquare} label={t("kpi.conversationsStarted")} value={n(m.outreach.started)} footnote={t("kpi.conversationsStartedFoot", { count: m.outreach.replied })} />
        <KpiTile icon={Eye} label={tOverview("kpi.profileViewsYours")} value={n(k.profile_views.current)} delta={countDelta(k.profile_views)} series={seriesOf(k.profile_views)} />
      </>
    );

    /* ---- Chart ------------------------------------------------------------- */
    const chartSeries: ChartSeries[] =
      view === "visibility"
        ? [
            { key: "profile", label: tOverview("kpi.profileViews"), color: "blue", values: k.profile_views.series },
            { key: "products", label: tOverview("kpi.productViews"), color: "gold", hatched: true, values: k.product_views.series },
          ]
        : [
            { key: "contacts", label: t("kpi.contactRequests"), color: "blue", values: k.contact_requests.series },
            { key: "responses", label: tOverview("kpi.responsesReceived"), color: "gold", hatched: true, values: k.responses_received.series },
          ];
    const chart = (
      <ActivityChart
        title={t(`chart.titles.${view}`)}
        subtitle={tOverview("periodCompare", { days })}
        startDate={m.current_start}
        series={chartSeries}
        totalLabel={t(`chart.totals.${view}`)}
        controls={
          <SegmentedSwitch
            label={t("chart.viewLabel")}
            value={view}
            onChange={setViewChoice}
            options={CHART_VIEWS.map((key) => ({ value: key, label: t(`chart.views.${key}`) }))}
          />
        }
      />
    );

    /* ---- Funnel ------------------------------------------------------------ */
    const funnel = seller ? (
      <FunnelCard
        id="stats-funnel"
        title={t("funnel.seller.title")}
        subtitle={t("funnel.seller.subtitle")}
        formatNumber={n}
        shareLabel={(s) => t("funnel.share", { percent: share(s, 1) })}
        empty={t("funnel.seller.empty")}
        steps={funnelSteps([
          { key: "views", value: views },
          { key: "contacts", value: k.contact_requests.current },
          { key: "replied", value: d.inbound.replied },
        ]).map((s) => ({ ...s, label: t(`funnel.seller.steps.${s.key}`) }))}
        footer={
          <p className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-slate-500">{t("funnel.seller.search")}</span>
            <span className="font-medium tabular-nums text-market-navy">{n(k.search_appearances.current)}</span>
          </p>
        }
      />
    ) : (
      <FunnelCard
        id="stats-funnel"
        title={t("funnel.buyer.title")}
        subtitle={t("funnel.buyer.subtitle")}
        formatNumber={n}
        color="gold"
        shareLabel={(s) => t("funnel.share", { percent: share(s) })}
        empty={t("funnel.buyer.empty")}
        steps={funnelSteps([
          { key: "started", value: m.outreach.started },
          { key: "replied", value: m.outreach.replied },
        ]).map((s) => ({ ...s, label: t(`funnel.buyer.steps.${s.key}`) }))}
        footer={
          <p className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-slate-500">{t("funnel.buyer.median")}</span>
            <span className="font-medium tabular-nums text-market-navy">{duration(m.outreach.median_reply_hours)}</span>
          </p>
        }
      />
    );

    /* ---- Cards ------------------------------------------------------------- */
    const topProducts = (
      <OverviewCard
        id="stats-top-products"
        title={t("topProducts.title")}
        subtitle={t("topProducts.subtitle")}
        footerLink={{ href: "/dashboard/products", label: t("topProducts.all") }}
        className="h-full"
      >
        {m.top_products.length === 0 ? (
          <EmptyHint text={t("topProducts.empty")} />
        ) : (
          <BarList
            items={m.top_products.map((p) => ({
              key: p.id,
              label: localized(p.name_en, p.name_fr, p.name),
              value: p.views,
              valueText: t("viewsCount", { count: p.views }),
            }))}
          />
        )}
      </OverviewCard>
    );

    const searchCard = (
      <OverviewCard id="stats-search" title={t("search.title")} subtitle={t("search.subtitle")} className="h-full">
        {m.top_search.length === 0 ? (
          <EmptyHint text={t("search.empty")} />
        ) : (
          <BarList
            items={m.top_search.map((e) => ({
              key: `${e.entity_type}-${e.entity_id}`,
              label: localized(e.name_en, e.name_fr),
              note: t(`search.kind.${e.entity_type}`),
              value: e.appearances,
              valueText: t("search.appearances", { count: e.appearances }),
            }))}
          />
        )}
      </OverviewCard>
    );

    const weekday = (
      <WeekdayCard
        id="stats-weekday"
        title={t("weekday.title")}
        subtitle={t("weekday.subtitle")}
        totals={weekdayTotals(sumSeries(k.profile_views.series, k.product_views.series), m.current_start)}
        dayLabels={WEEK.map((day) => format.dateTime(day, { weekday: "short", timeZone: "UTC" }))}
        dayNames={WEEK.map((day) => format.dateTime(day, { weekday: "long", timeZone: "UTC" }))}
        formatNumber={n}
        bestLabel={(day) => t("weekday.best", { day })}
        empty={t("weekday.empty")}
        dayHeader={t("weekday.dayHeader")}
        valueHeader={t("weekday.valueHeader")}
      />
    );

    const responsiveness = (
      <OverviewCard
        id="stats-responsiveness"
        title={t("responsiveness.title")}
        subtitle={t("responsiveness.subtitle")}
        footerLink={{ href: "/dashboard/inbox", label: t("responsiveness.inbox") }}
        className="h-full"
      >
        <FigureList
          items={[
            { key: "received", icon: MessagesSquare, label: t("responsiveness.received"), value: n(d.inbound.received) },
            {
              key: "replied",
              icon: MessageCircleReply,
              label: t("responsiveness.replied"),
              note: answerRate === null ? undefined : t("responsiveness.repliedNote", { percent: share(answerRate) }),
              value: n(d.inbound.replied),
            },
            { key: "median", icon: Timer, label: t("responsiveness.median"), value: duration(d.inbound.median_reply_hours) },
            {
              key: "requests",
              icon: Inbox,
              label: t("responsiveness.requests"),
              note: d.requests.unopened > 0 ? t("responsiveness.requestsNote", { count: d.requests.unopened }) : undefined,
              value: n(d.requests.current),
            },
          ]}
        />
      </OverviewCard>
    );

    const c = d.catalogue;
    const ratio = (value: number) => t("ratio", { value: n(value), total: n(c.products) });
    const catalogue = (
      <OverviewCard
        id="stats-catalogue"
        title={t("catalogue.title")}
        subtitle={t("catalogue.subtitle")}
        footerLink={c.products > 0 ? { href: "/dashboard/products", label: t("catalogue.manage") } : undefined}
        className="h-full"
      >
        {c.products === 0 ? (
          <EmptyHint text={t("catalogue.empty")} cta={{ href: "/dashboard/products/new", label: t("catalogue.add") }} />
        ) : (
          <MeterList
            items={[
              { key: "published", label: t("catalogue.published"), value: c.published, total: c.products, valueText: ratio(c.published) },
              { key: "photo", label: t("catalogue.withPhoto"), value: c.with_photo, total: c.products, valueText: ratio(c.with_photo) },
              { key: "priced", label: t("catalogue.priced"), value: c.priced, total: c.products, valueText: ratio(c.priced) },
              { key: "viewed", label: t("catalogue.viewed"), value: c.viewed, total: c.products, valueText: ratio(c.viewed) },
            ]}
          />
        )}
      </OverviewCard>
    );

    const o = d.opportunities;
    const opportunities = (
      <OverviewCard
        id="stats-opportunities"
        title={t(`opportunities.title.${audience}`)}
        subtitle={t("opportunities.subtitle", { published: o.published, responses: o.responses })}
        footerLink={{ href: "/dashboard/opportunities", label: t("opportunities.all") }}
        className="h-full"
      >
        {o.top.length === 0 ? (
          <EmptyHint text={t(`opportunities.empty.${audience}`)} cta={{ href: "/dashboard/opportunities/new", label: t("opportunities.publish") }} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {o.top.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1">
                  <Link href={`/dashboard/opportunities/${item.id}`} className="block truncate text-[13px] font-medium text-market-navy hover:underline">
                    {localized(item.title_en, item.title_fr)}
                  </Link>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", item.status === "published" ? "bg-emerald-500" : "bg-amber-500")} />
                    {t(`opportunities.status.${item.status === "published" ? "published" : "pending"}`)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold tabular-nums text-market-navy">
                  {t("opportunities.responses", { count: item.responses })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </OverviewCard>
    );

    const byCompany = d.companies_count > 1 && (
      <>
        <SectionHeading
          id="stats-companies"
          title={t("companies.title")}
          hint={t("companies.hint", { count: d.companies_count, shown: d.by_company.length })}
        />
        <section aria-labelledby="stats-companies" className="overflow-x-auto rounded-2xl bg-white p-2 ring-1 ring-slate-200/70">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-slate-500">
                <th scope="col" className="rounded-l-xl bg-slate-50 px-3 py-2.5 font-medium">{t("companies.company")}</th>
                <th scope="col" className="bg-slate-50 px-3 py-2.5 text-right font-medium">{tOverview("kpi.profileViews")}</th>
                <th scope="col" className="bg-slate-50 px-3 py-2.5 text-right font-medium">{tOverview("kpi.productViews")}</th>
                <th scope="col" className="rounded-r-xl bg-slate-50 px-3 py-2.5 text-right font-medium">{t("kpi.contactRequests")}</th>
              </tr>
            </thead>
            <tbody>
              {d.by_company.map((company) => (
                <tr key={company.id} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="max-w-0 px-3 py-3 font-medium">
                    <Link href={`/dashboard/companies/${company.id}/edit`} className="block truncate text-market-navy hover:underline">
                      {company.name}
                    </Link>
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{n(company.profile_views)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{n(company.product_views)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{n(company.contacts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </>
    );

    const row = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";
    const cell = (node: React.ReactNode, key: string) => <div key={key} className="min-w-0">{node}</div>;

    return (
      <>
        {hero}

        <section aria-label={t("kpi.label")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis}
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">{chart}</div>
          <div className="min-w-0 xl:col-span-4">{funnel}</div>
        </div>

        {seller ? (
          <>
            <SectionHeading title={t("sections.attraction.title")} hint={t("sections.attraction.hint")} />
            <div className={row}>{[cell(topProducts, "products"), cell(searchCard, "search"), cell(weekday, "weekday")]}</div>
            <SectionHeading title={t("sections.followUp.title")} hint={t("sections.followUp.hint")} />
            <div className={row}>{[cell(responsiveness, "responsiveness"), cell(catalogue, "catalogue"), cell(opportunities, "opportunities")]}</div>
          </>
        ) : (
          <>
            <SectionHeading title={t("sections.prospecting.title")} hint={t("sections.prospecting.hint")} />
            <div className={row}>{[cell(opportunities, "opportunities"), cell(responsiveness, "responsiveness"), cell(weekday, "weekday")]}</div>
            {c.products > 0 && (
              <>
                <SectionHeading title={t("sections.showcase.title")} hint={t("sections.showcase.hint")} />
                <div className={row}>{[cell(topProducts, "products"), cell(searchCard, "search"), cell(catalogue, "catalogue")]}</div>
              </>
            )}
          </>
        )}

        {byCompany}
      </>
    );
  }
}
