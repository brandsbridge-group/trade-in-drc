import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { FindPartnerHero } from "@/components/requests/market/find-partner-hero";
import { FindPartnerFlow } from "@/components/requests/market/find-partner-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FindPartner" });
  return {
    title: t("hero.title"),
    description: t("hero.subtitle"),
    openGraph: {
      title: t("hero.title"),
      description: t("hero.subtitle"),
      type: "website",
    },
  };
}

/**
 * /request — "Find a Local Partner" (customer design 10).
 * Server component: resolves locale, loads sector options for the form select,
 * and hands off to the client flow that manages need → form → confirmation.
 */
export default async function RequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FindPartner" });

  const supabase = await createServerSupabaseClient();
  const rawSectors = await listSectorOptions(supabase);
  const sectors = rawSectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", locale as Locale),
  }));

  return (
    <main className="bg-white">
      <FindPartnerHero
        breadcrumbHome={t("breadcrumb.home")}
        breadcrumbCurrent={t("breadcrumb.current")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        submitCta={t("hero.submitCta")}
        browseCta={t("hero.browseCta")}
      />
      <FindPartnerFlow sectors={sectors} />
    </main>
  );
}
