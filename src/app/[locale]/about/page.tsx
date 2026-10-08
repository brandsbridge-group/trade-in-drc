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
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,37,76,0.14),transparent_52%)] text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(13,29,62,0.14),transparent_60%)]" />

      <div className="relative">
        <AboutHero locale={locale} />

        <div className="mx-auto -mt-10 w-full max-w-7xl px-4 pb-1 md:px-6">
          <LandingMissionBanner locale={locale} />
        </div>

        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
          <LandingValueCards locale={locale} />
          <LandingTransformBanner locale={locale} />
          <LandingJoinCta locale={locale} />
        </div>
      </div>
    </div>
  );
}
