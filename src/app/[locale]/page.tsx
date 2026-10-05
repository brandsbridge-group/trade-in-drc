import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
// "Trade in DRC" gateway hero (customer design — home-trade-in-drc.ai), restored on top.
import { HeroBackdrop } from "@/components/home/landing/hero-backdrop";
import { LandingHero } from "@/components/home/landing/landing-hero";
import { LandingTrustRibbon } from "@/components/home/landing/landing-trust-ribbon";
// New homepage sections (boxed layout, see home-section.tsx).
import { HomeStart } from "@/components/home/start/home-start";
import { HomeMarket } from "@/components/home/market/home-market";
import { HomeDemands } from "@/components/home/demands/home-demands";
import { HomeSuppliers } from "@/components/home/suppliers/home-suppliers";
import { HomeChain } from "@/components/home/chain/home-chain";
import { HomeWhy } from "@/components/home/why/home-why";
import { HomeSectors } from "@/components/home/sectors/home-sectors";
import { HomeSteps } from "@/components/home/steps/home-steps";
import { HomeClosing } from "@/components/home/closing/home-closing";

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
 * Home page (redesigned 2026-09-30): the full-bleed gateway hero, then boxed
 * sections — commitments + entry paths, the live market, buyer requests,
 * verified suppliers, the service chain, why the DRC (full-width video band),
 * key sectors, three steps — and the closing hero (full-bleed statement with
 * the join CTA, on the gateway hero's container). About / mission / values now live on /about (Nav → More); the
 * old composition is preserved at /home-classic.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    // -mb-12 cancels the site footer's top margin so the page's own background
    // runs into the footer instead of leaving a white strip.
    <div className="-mb-12 bg-slate-50">
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
        <HomeDemands locale={locale} />
        <HomeSuppliers locale={locale} />
        <HomeChain locale={locale} />
        <HomeWhy locale={locale} />
        <HomeSectors locale={locale} />
        <HomeSteps locale={locale} />
        <HomeClosing locale={locale} />
      </div>
    </div>
  );
}
