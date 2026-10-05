import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { countOffersByOrigin } from "@/lib/marketplace/queries";
import { MarketHero } from "@/components/marketplace/landing/market-hero";
import { MarketTrustStrip } from "@/components/marketplace/landing/market-trust-strip";
import { MarketDirections } from "@/components/marketplace/landing/market-directions";
import { MarketServicesGrid } from "@/components/marketplace/landing/market-services-grid";
import { MarketDemands } from "@/components/marketplace/landing/market-demands";
import { MarketCtaBand } from "@/components/marketplace/landing/market-cta-band";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MarketLanding.hero" });
  const title = `${t("titleLead")} ${t("titleAccent")}`;
  return {
    title,
    description: t("lead"),
    openGraph: { title, description: t("lead"), type: "website" },
  };
}

/**
 * The DRC marketplace landing: the hero with its advertising carousel, the two
 * directions of trade (import / export), the service trades that complete an
 * operation, and live buyer requests.
 */
export default async function MarketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  const offerCounts = await countOffersByOrigin(supabase);

  return (
    <div data-page-end="flush" className="bg-white">
      <MarketHero locale={locale} />
      <MarketDirections offerCounts={offerCounts} />
      <MarketTrustStrip />
      <MarketServicesGrid />
      <MarketDemands locale={locale} />
      <MarketCtaBand />
    </div>
  );
}
