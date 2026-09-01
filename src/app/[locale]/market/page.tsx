import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SEGMENT_KEYS, type SegmentKey } from "@/lib/marketplace/segments";
import { MARKET_CATEGORIES } from "@/lib/marketplace/categories";
import { DRC_PROVINCES } from "@/config/provinces";
import { MarketPageHero, type HeroStat } from "@/components/marketplace/market-page-hero";
import { CategoryGrid } from "@/components/marketplace/category-grid";
import { WhyUseCard } from "@/components/marketplace/why-use-card";
import { PopularOpportunities } from "@/components/marketplace/popular-opportunities";
import { JoinTodayCard } from "@/components/marketplace/join-today-card";
import {
  MarketplaceStatsStrip,
  type StripStat,
} from "@/components/marketplace/marketplace-stats-strip";

/** "1,000+" / "60+" style rounding, matching the home stats band. */
function approx(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "+";
  if (n >= 20) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MarketplacePage.hero" });
  const title = `${t("titleLead")} ${t("titleAccent")}`;
  return {
    title,
    description: t("body"),
    openGraph: { title, description: t("body"), type: "website" },
  };
}

/**
 * The DRC Business Marketplace — customer design
 * (latest-designs/marketplace-drc-business.ai). Hero, nine category cards with
 * live counts, the why/opportunities/join band, and a closing stats strip.
 * Every number is read from Supabase; nothing here is hard-coded sample data.
 */
export default async function MarketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  const [segmentRows, companiesCount, opportunitiesCount, categoriesCount, institutionsCount] =
    await Promise.all([
      supabase
        .from("company_segments")
        .select("segment_key, companies!inner(status)")
        .eq("companies.status", "verified"),
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "verified"),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("institutions").select("id", { count: "exact", head: true }),
    ]);

  // Live company count per category. Government bodies and public corporations
  // point at the real institutions directory, so they count institutions.
  const counts = Object.fromEntries(SEGMENT_KEYS.map((k) => [k, 0])) as Record<SegmentKey, number>;
  for (const row of (segmentRows.data ?? []) as { segment_key: string }[]) {
    if (row.segment_key in counts) counts[row.segment_key as SegmentKey] += 1;
  }
  for (const cat of MARKET_CATEGORIES) {
    if (cat.countsInstitutions) counts[cat.key] = institutionsCount.count ?? 0;
  }

  const companies = companiesCount.count ?? 0;
  const opportunities = opportunitiesCount.count ?? 0;
  const productCategories = categoriesCount.count ?? 0;

  const heroStats: HeroStat[] = [
    { key: "companies", value: approx(companies) },
    { key: "provinces", value: String(DRC_PROVINCES.length) },
    { key: "opportunities", value: approx(opportunities) },
    { key: "secure", value: "100%" },
  ];

  const stripStats: StripStat[] = [
    { key: "companies", value: approx(companies) },
    { key: "provinces", value: String(DRC_PROVINCES.length) },
    { key: "categories", value: approx(productCategories) },
    { key: "opportunities", value: approx(opportunities) },
    { key: "access", value: "24/7" },
    { key: "secure", value: "100%" },
  ];

  return (
    <div className="bg-white">
      <MarketPageHero stats={heroStats} />
      <CategoryGrid counts={counts} />

      <section className="mx-auto w-full max-w-[1500px] px-4 pb-8 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(0,0.95fr)]">
          <WhyUseCard />
          <PopularOpportunities locale={locale} />
          <JoinTodayCard />
        </div>
      </section>

      <MarketplaceStatsStrip stats={stripStats} />
    </div>
  );
}
