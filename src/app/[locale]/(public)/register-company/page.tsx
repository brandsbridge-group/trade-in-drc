import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { RegisterHero } from "@/components/register/market/register-hero";
import { RegisterWizard } from "@/components/register/market/register-wizard";
import { BenefitsStrip } from "@/components/register/market/benefits-strip";
import type { SectorOption } from "@/components/register/market/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RegisterCompany" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      type: "website",
    },
  };
}

/**
 * Register Your Company (customer design 6): navy marketing hero → 3 pricing
 * tiers → 5-step registration wizard → benefits strip. The wizard is a client
 * component; sector options are resolved server-side (bilingual labels).
 */
export default async function RegisterCompanyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const rawSectors = await listSectorOptions(supabase);
  const sectors: SectorOption[] = rawSectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", locale as Locale),
  }));

  return (
    <main className="bg-slate-50/60">
      <RegisterHero />
      <RegisterWizard sectors={sectors} />
      <BenefitsStrip />
    </main>
  );
}
