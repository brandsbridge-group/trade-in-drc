import { AlertRibbon } from "@/components/home/alert-ribbon";
import { HeroSection } from "@/components/home/hero-section";
import { StatsStrip } from "@/components/home/stats-strip";
import { FeaturedOpportunitiesSection } from "@/components/home/featured-opportunities-section";
import { WhyStrip } from "@/components/home/why-strip";
import { ExplorerSection } from "@/components/home/explorer-section";
import { LatestBlock } from "@/components/home/latest-block";
import { RfqCtaSection } from "@/components/home/rfq-cta-section";
import { BrandCarouselSection } from "@/components/home/brand-carousel-section";
import { FaqSection } from "@/components/home/faq-section";

/**
 * Backup of the previous (app-like) homepage composition.
 * Preserved verbatim while the marketing landing redesign lives at `/`.
 * Reachable at /[locale]/home-classic.
 */
export default async function HomeClassicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <AlertRibbon />
      <HeroSection locale={locale} />
      <StatsStrip locale={locale} />
      <FeaturedOpportunitiesSection locale={locale} />
      <WhyStrip locale={locale} />
      <ExplorerSection locale={locale} />
      <LatestBlock locale={locale} />
      <RfqCtaSection locale={locale} />
      <BrandCarouselSection />
      <FaqSection />
    </>
  );
}
