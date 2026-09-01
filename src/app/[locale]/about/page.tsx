import { AboutHero } from "@/components/home/landing/about-hero";
import { LandingMissionBanner } from "@/components/home/landing/landing-mission-banner";
import { LandingValueCards } from "@/components/home/landing/landing-value-cards";
import { LandingTransformBanner } from "@/components/home/landing/landing-transform-banner";
import { LandingJoinCta } from "@/components/home/landing/landing-join-cta";

/**
 * About Us — navy + gold marketing layout (matches the Congo reference, Image 10).
 * Composed from the shared landing sections so the homepage continuation and this
 * page stay in lockstep (single source of copy + design).
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="marketing-surface bg-white">
      <AboutHero locale={locale} />
      <LandingMissionBanner locale={locale} />
      <LandingValueCards locale={locale} />
      <LandingTransformBanner locale={locale} />
      <LandingJoinCta locale={locale} />
    </div>
  );
}
