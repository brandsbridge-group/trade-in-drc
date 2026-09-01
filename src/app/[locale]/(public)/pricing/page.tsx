import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PricingHero } from "@/components/pricing/market/pricing-hero";
import { BenefitsStrip } from "@/components/pricing/market/benefits-strip";
import { WhatYouGet } from "@/components/pricing/market/what-you-get";
import { HowItWorks } from "@/components/pricing/market/how-it-works";
import { AssistanceBand } from "@/components/pricing/market/assistance-band";
import { PromoteTabs } from "@/components/pricing/market/promote-tabs";
import { PromoteCtaBar } from "@/components/pricing/market/promote-cta-bar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Premium");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * Premium Membership page (customer design 12). Server component: one
 * `getTranslations("Premium")` call is shared with the presentational RSC
 * sections; the only client islands are the apply-dialog buttons.
 */
export default async function PricingPage() {
  const t = await getTranslations("Premium");

  return (
    <div className="bg-market-cream">
      <PricingHero t={t} />
      <BenefitsStrip t={t} />

      {/* Local / International / Compare — customer design 2026-07-28. */}
      <div className="pt-10">
        <PromoteTabs />
      </div>

      <section className="mx-auto max-w-[1500px] px-4 py-12 md:px-6 md:py-14">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <WhatYouGet t={t} />
          <HowItWorks t={t} />
        </div>
      </section>

      <AssistanceBand t={t} />
      <PromoteCtaBar />
    </div>
  );
}
