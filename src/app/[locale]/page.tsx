import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
// "Trade in DRC" gateway hero (customer design — home-trade-in-drc.ai), restored on top.
import { HeroBackdrop } from "@/components/home/landing/hero-backdrop";
import { LandingHero } from "@/components/home/landing/landing-hero";
import { LandingTrustRibbon } from "@/components/home/landing/landing-trust-ribbon";
// New homepage sections (boxed layout, see home-section.tsx).
import { HomeStart } from "@/components/home/start/home-start";
import { HomeMarket } from "@/components/home/market/home-market";
// Previous landing sections, still shown until their replacement is built.
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
 * Home page, being rebuilt section by section (2026-09-30): the full-bleed
 * gateway hero, then boxed sections — commitments + entry paths, the live
 * market. The previous landing sections below stay until each is replaced;
 * the old composition is preserved at /home-classic.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="bg-slate-50">
      {/* ── Gateway hero: cinematic backdrop behind the hero copy and the
             dashboard panel, then the trust ribbon closes it. ── */}
      <div className="marketing-surface">
        <section className="relative isolate overflow-hidden bg-[var(--color-landing-navy-2)]">
          <HeroBackdrop />
          <div className="relative z-10">
            <LandingHero locale={locale} />
          </div>
        </section>
        <LandingTrustRibbon locale={locale} />
        <HomeStart locale={locale} />
        <HomeMarket locale={locale} />
      </div>

      {/* ── Previous landing sections, pending their redesign. ── */}
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
