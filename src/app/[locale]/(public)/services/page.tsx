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
    <div className="relative bg-[radial-gradient(circle_at_top,_rgba(16,36,71,0.12),transparent_45%)] text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(12,24,48,0.12),transparent_60%)]" />

      <div className="relative">
        <ServicesHero />

        <div className="mx-auto w-full max-w-[1400px] px-4 py-4 md:px-6">
          <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-3 shadow-[0_30px_70px_-38px_rgba(15,23,42,0.42)] backdrop-blur-sm">
            <ServiceCards />
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 py-4 md:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <WhoWeServe />
          <RequestServiceForm sectors={sectors} />
        </div>

        <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 pb-10 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectorsStrip />
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}
