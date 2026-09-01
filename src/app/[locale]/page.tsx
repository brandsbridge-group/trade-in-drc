import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
// "Trade in DRC" gateway hero (customer design — home-trade-in-drc.ai), restored on top.
import { HeroBackdrop } from "@/components/home/landing/hero-backdrop";
import { LandingHero } from "@/components/home/landing/landing-hero";
import { LandingFeatures } from "@/components/home/landing/landing-features";
import { LandingTrustRibbon } from "@/components/home/landing/landing-trust-ribbon";
// Marketplace sections (customer design 1) — kept below the gateway hero.
import { MarketHero } from "@/components/home/market/market-hero";
import { MarketStatsBand } from "@/components/home/market/market-stats-band";
import { MarketShowcase } from "@/components/home/market/market-showcase";
import { MarketBanners } from "@/components/home/market/market-banners";
import { MarketRail } from "@/components/home/market/market-rail";
// Full below-hero landing (the old marketing composition) — appended at the bottom.
import { HomeSearchBand } from "@/components/home/home-search-band";
import { HomeCarousel } from "@/components/home/home-carousel";
import { FeaturedCompaniesStrip } from "@/components/home/featured-companies-strip";
import { LandingAboutIntro } from "@/components/home/landing/landing-about-intro";
import { LandingWhyDrc } from "@/components/home/landing/landing-why-drc";
import { LandingSectors } from "@/components/home/landing/landing-sectors";
import { LandingMissionBanner } from "@/components/home/landing/landing-mission-banner";
import { LandingValueCards } from "@/components/home/landing/landing-value-cards";
import { LandingHowItWorks } from "@/components/home/landing/landing-how-it-works";
import { LandingTransformBanner } from "@/components/home/landing/landing-transform-banner";
import { LandingJoinCta } from "@/components/home/landing/landing-join-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

/**
 * Home page. Per customer request (2026-07-23): the "Trade in DRC" gateway hero
 * (map + Kinshasa skyline + dashboard panel + feature cards + trust ribbon) sits
 * on top, and the full marketplace landing (design 1) follows below it — nothing
 * removed. The app-like composition is still preserved at /home-classic.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const rawSectors = await listSectorOptions(supabase);
  const sectors = rawSectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", locale as Locale),
  }));

  return (
    <div className="bg-slate-50">
      {/* ── Gateway hero: cinematic backdrop spans hero copy, dashboard panel,
             and the three feature cards, then the trust ribbon closes it. ── */}
      <div className="marketing-surface">
        <section className="relative isolate overflow-hidden bg-[var(--color-landing-navy-2)]">
          <HeroBackdrop />
          <div className="relative z-10">
            <LandingHero locale={locale} />
            <LandingFeatures locale={locale} />
          </div>
        </section>
        <LandingTrustRibbon locale={locale} />
      </div>

      {/* ── Marketplace landing (design 1) — full experience kept below. ── */}
      <MarketHero sectors={sectors} />
      <MarketStatsBand />
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <MarketShowcase locale={locale} sectors={sectors} />
          <MarketBanners />
        </div>
        <MarketRail sectors={sectors} />
      </div>

      {/* ── Full below-hero landing composition, appended per customer request
             (2026-07-23): everything the old landing showed under the hero, kept
             intact so nothing is lost — only added. ── */}
      <HomeSearchBand />
      <HomeCarousel locale={locale} />
      <FeaturedCompaniesStrip locale={locale} />
      <LandingAboutIntro locale={locale} />
      <LandingWhyDrc locale={locale} />
      <LandingSectors locale={locale} />
      <LandingMissionBanner locale={locale} />
      <LandingValueCards locale={locale} />
      <LandingHowItWorks locale={locale} />
      <LandingTransformBanner locale={locale} />
      <LandingJoinCta locale={locale} />
    </div>
  );
}
