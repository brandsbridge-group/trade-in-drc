import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { DRC_PROVINCES } from "@/config/provinces";
import type { Locale } from "@/config/locales";

import { HeroSearch, type HeroSectorOption } from "@/components/data-hub/market/hero-search";
import { StatTiles } from "@/components/data-hub/market/stat-tiles";
import { KpiCards, type KpiCardData } from "@/components/data-hub/market/kpi-cards";
import { ChartTrend, type TrendPoint } from "@/components/data-hub/market/chart-trend";
import { ChartBar, type SectorBar } from "@/components/data-hub/market/chart-bar";
import { ChartDonut, type DonutSegment } from "@/components/data-hub/market/chart-donut";
import { ChartChoropleth } from "@/components/data-hub/market/chart-choropleth";
import { ReportsTable, type ReportRow } from "@/components/data-hub/market/reports-table";
import { BrowseCategories } from "@/components/data-hub/market/browse-categories";
import { IntelForm } from "@/components/data-hub/market/intel-form";
import { WhyPanel, PromoCards } from "@/components/data-hub/market/rail-panels";
import {
  bucketForCount,
  formatCountPlus,
  DONUT_TOP_SECTORS,
  REPORTS_LIMIT,
  type CoverageBucket,
} from "@/components/data-hub/market/constants";

export default async function DataHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  // Active filters from the hero "Search Data" bar — these drive the results.
  const fSector = one(sp.sector); // sector id
  const fProvince = one(sp.province); // province name
  const fType = one(sp.type); // "" | "report" | "dataset" | "prices"
  const fRange = one(sp.range); // "" | "12" | "24" | "all"
  const hasFilters = Boolean(fSector || fProvince || fType || fRange);

  const supabase = await createServerSupabaseClient();
  const tCharts = await getTranslations({ locale, namespace: "MarketIntel.charts" });
  const tReports = await getTranslations({ locale, namespace: "MarketIntel.reports" });
  const tDashboard = await getTranslations({ locale, namespace: "MarketIntel.dashboard" });
  const tHero = await getTranslations({ locale, namespace: "MarketIntel.hero" });

  // Reports query — filtered by the selected sector (the core searchable data).
  let reportsQuery = supabase
    .from("reports")
    .select("slug, title_en, title_fr, summary_en, summary_fr, sector_id, published_at")
    .eq("kind", "market_report")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(REPORTS_LIMIT);
  if (fSector) reportsQuery = reportsQuery.eq("sector_id", fSector);

  // --- Parallel data reads ------------------------------------------------
  const [
    sectorOptions,
    metricsRes,
    seriesRes,
    activityRes,
    companiesRes,
    reportsRes,
    reportsCountRes,
  ] = await Promise.all([
    listSectorOptions(supabase),
    supabase
      .from("market_metrics")
      .select("key, label_en, label_fr, value_display, delta_pct, period_en, period_fr, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("trade_series").select("month, exports_usd, imports_usd").order("month", { ascending: true }),
    supabase
      .from("sector_activity")
      .select("label_en, label_fr, trade_value_usd, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("companies").select("sector_id, province"),
    reportsQuery,
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("kind", "market_report")
      .eq("status", "published"),
  ]);

  // --- Localized sector lookup -------------------------------------------
  const sectorLabelById = new Map<string, string>();
  const sectors: HeroSectorOption[] = sectorOptions.map((s) => {
    const label = pickLocalized(s, "name", locale);
    sectorLabelById.set(s.id, label);
    return { id: s.id, label };
  });

  // --- KPI cards ----------------------------------------------------------
  const metrics: KpiCardData[] = (metricsRes.data ?? []).map((m) => ({
    key: m.key,
    label: pickLocalized(m, "label", locale),
    value: m.value_display,
    deltaPct: m.delta_pct,
    period: pickLocalized(m, "period", locale),
  }));

  // --- Trend line ---------------------------------------------------------
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" });
  const trendAll: TrendPoint[] = (seriesRes.data ?? []).map((r) => ({
    label: monthFmt.format(new Date(r.month)),
    exports: r.exports_usd,
    imports: r.imports_usd,
  }));
  // Time-range filter drives how many months of trend are shown.
  const rangeMonths = fRange === "all" ? trendAll.length : fRange === "m24" ? 24 : 12;
  const trend = trendAll.slice(-rangeMonths);

  // --- Sector activity bar -----------------------------------------------
  const bars: SectorBar[] = (activityRes.data ?? []).map((r) => ({
    label: pickLocalized(r, "label", locale),
    value: r.trade_value_usd,
  }));

  // --- Companies-by-sector donut (derived) -------------------------------
  const companies = companiesRes.data ?? [];
  const companiesTotal = companies.length;
  const sectorCounts = new Map<string, number>();
  for (const c of companies) {
    if (c.sector_id) sectorCounts.set(c.sector_id, (sectorCounts.get(c.sector_id) ?? 0) + 1);
  }
  const rankedSectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]);
  const withSectorTotal = rankedSectors.reduce((sum, [, n]) => sum + n, 0);
  const topSectors = rankedSectors.slice(0, DONUT_TOP_SECTORS);
  const otherCount = withSectorTotal - topSectors.reduce((sum, [, n]) => sum + n, 0);
  const donutSegments: DonutSegment[] = topSectors.map(([id, count]) => ({
    label: sectorLabelById.get(id) ?? tCharts("donut.other"),
    pct: withSectorTotal > 0 ? (count / withSectorTotal) * 100 : 0,
  }));
  if (otherCount > 0 && withSectorTotal > 0) {
    donutSegments.push({ label: tCharts("donut.other"), pct: (otherCount / withSectorTotal) * 100 });
  }

  // --- Provincial coverage choropleth (derived) --------------------------
  const provinceCounts = new Map<string, number>();
  for (const c of companies) {
    if (c.province) provinceCounts.set(c.province, (provinceCounts.get(c.province) ?? 0) + 1);
  }
  const maxProvince = Math.max(0, ...provinceCounts.values());
  const buckets: Record<string, CoverageBucket> = {};
  for (const province of DRC_PROVINCES) {
    buckets[province] = bucketForCount(provinceCounts.get(province) ?? 0, maxProvince);
  }

  // --- Reports table ------------------------------------------------------
  const dateFmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" });
  const reportRows: ReportRow[] = (reportsRes.data ?? []).map((r) => {
    const title = pickLocalized(r, "title", locale);
    const isDataset = /index|dataset|data|climate/i.test(`${r.slug} ${title}`);
    return {
      slug: r.slug,
      title,
      category: r.sector_id ? sectorLabelById.get(r.sector_id) ?? tReports("category.investment") : tReports("category.investment"),
      coverageKey: isDataset ? "provinces" : "national",
      typeKey: isDataset ? "dataset" : "report",
      publishedLabel: r.published_at ? dateFmt.format(new Date(r.published_at)) : "—",
      attachmentUrl: null,
    };
  });
  // Data-type filter (Reports vs Datasets) from the hero bar.
  const typeFilter = fType === "reports" ? "report" : fType === "datasets" ? "dataset" : "";
  const reportRowsView = typeFilter
    ? reportRows.filter((r) => r.typeKey === typeFilter)
    : reportRows;

  // --- Stat tiles ---------------------------------------------------------
  const statData = {
    companies: formatCountPlus(companiesTotal),
    provinces: String(DRC_PROVINCES.length),
    sectors: String(sectorOptions.length),
    reports: formatCountPlus(reportsCountRes.count ?? reportRows.length),
  };

  return (
    <div className="bg-slate-50">
      <HeroSearch
        sectors={sectors}
        defaults={{
          sector: one(sp.sector),
          province: one(sp.province),
          type: one(sp.type),
          range: one(sp.range),
        }}
      />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
          <StatTiles data={statData} />
        </div>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">{tHero("filters.active")}</span>
            {fSector && sectorLabelById.get(fSector) && (
              <span className="rounded-full bg-market-navy/10 px-3 py-1 font-medium text-market-navy">
                {sectorLabelById.get(fSector)}
              </span>
            )}
            {fProvince && (
              <span className="rounded-full bg-market-navy/10 px-3 py-1 font-medium text-market-navy">{fProvince}</span>
            )}
            {fType && (
              <span className="rounded-full bg-market-navy/10 px-3 py-1 font-medium text-market-navy">
                {tHero(`dataType.${fType}`)}
              </span>
            )}
            {fRange && fRange !== "m12" && (
              <span className="rounded-full bg-market-navy/10 px-3 py-1 font-medium text-market-navy">
                {tHero(`timeRange.${fRange}`)}
              </span>
            )}
            <Link href="/data-hub" className="font-semibold text-market-red underline underline-offset-2">
              {tHero("filters.clear")}
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2" id="dashboard">
            <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-market-navy">
                {tDashboard("title")}
              </h2>
              <KpiCards metrics={metrics} />
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ChartTrend series={trend} />
                <ChartBar bars={bars} />
                <ChartDonut segments={donutSegments} centerValue={formatCountPlus(companiesTotal)} />
                <ChartChoropleth buckets={buckets} active={fProvince} />
              </div>
            </section>

            <ReportsTable rows={reportRowsView} />
            <BrowseCategories />
          </div>

          {/* Right rail */}
          <aside className="space-y-6">
            <IntelForm sectors={sectors} />
            <WhyPanel />
            <PromoCards />
          </aside>
        </div>
      </div>
    </div>
  );
}
