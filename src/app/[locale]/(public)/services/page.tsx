import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { ServicesHero } from "@/components/services/market/services-hero";
import { ServiceCards } from "@/components/services/market/service-cards";
import { RequestServiceForm } from "@/components/services/market/request-service-form";
import { WhoWeServe } from "@/components/services/market/who-we-serve";
import { SectorsStrip } from "@/components/services/market/sectors-strip";
import { HowItWorks } from "@/components/services/market/how-it-works";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services.hero" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Our Services (customer design) — public services catalog: hero + 7 service
 * cards + a "Request a Service" lead form (→ business_requests, admin-visible)
 * beside "Who We Serve", the sectors strip, and a How-It-Works band.
 */
export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const rawSectors = await listSectorOptions(supabase);
  const sectors = rawSectors.map((s) => ({ id: s.id, label: pickLocalized(s, "name", locale as Locale) }));

  return (
    <div className="bg-slate-50">
      <ServicesHero />
      <ServiceCards />
      <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 py-4 md:px-6 lg:grid-cols-[1fr_360px]">
        <RequestServiceForm sectors={sectors} />
        <WhoWeServe />
      </div>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-10 md:px-6">
        <SectorsStrip />
        <HowItWorks />
      </div>
    </div>
  );
}
