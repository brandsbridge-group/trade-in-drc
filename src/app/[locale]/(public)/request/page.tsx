import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import type { PartnerRequestValues } from "@/lib/requests/partner-request";
import { FindPartnerHero } from "@/components/requests/market/find-partner-hero";
import { PartnerRequestWizard } from "@/components/requests/market/partner-request-wizard";
import { RequestAside } from "@/components/requests/market/request-aside";

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
 * /request — "Find a local partner". A visitor (no account needed) describes a
 * need in three steps; the request lands in the console's request list.
 * Server component: loads the sector options and, for a signed-in visitor,
 * what is already known about them so they do not type it again.
 */
export default async function RequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const [rawSectors, prefill] = await Promise.all([listSectorOptions(supabase), loadPrefill(supabase)]);
  const sectors = rawSectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", locale as Locale),
  }));

  return (
    <main data-page-end="flush" className="bg-slate-100">
      <FindPartnerHero />
      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <PartnerRequestWizard sectors={sectors} prefill={prefill} />
          </div>
          <RequestAside />
        </div>
      </section>
    </main>
  );
}

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/** Name, e-mail, phone and first company of the signed-in visitor; empty for a guest. */
async function loadPrefill(supabase: ServerClient): Promise<Partial<PartnerRequestValues>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("companies").select("name, country, website").eq("owner_id", user.id).order("created_at").limit(1),
  ]);
  const company = companies?.[0];

  const prefill: Partial<PartnerRequestValues> = {};
  if (user.email) prefill.email = user.email;
  if (profile?.full_name) prefill.contactPerson = profile.full_name;
  if (profile?.phone?.startsWith("+")) prefill.phone = profile.phone.replace(/[^\d+]/g, "");
  if (company?.name) prefill.companyName = company.name;
  if (company?.country) prefill.country = company.country;
  if (company?.website) prefill.website = company.website;
  return prefill;
}
