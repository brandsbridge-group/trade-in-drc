import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { RegisterHero } from "@/components/register/market/register-hero";
import {
  RegisterWizard,
  type RegisterAccount,
} from "@/components/register/market/register-wizard";
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
 * Add a company: hero → profile gate → short 2–3 step form → benefits strip.
 * The form itself only renders for a signed-in account (brief v2): signed-out
 * visitors are sent from the gate to /signup and come back here afterwards.
 * The account's e-mail, name and phone prefill the contact step.
 */
export default async function RegisterCompanyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const [rawSectors, { data: auth }] = await Promise.all([
    listSectorOptions(supabase),
    supabase.auth.getUser(),
  ]);

  let account: RegisterAccount | null = null;
  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", auth.user.id)
      .maybeSingle();
    account = {
      id: auth.user.id,
      email: auth.user.email ?? "",
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
    };
  }
  const sectors: SectorOption[] = rawSectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", locale as Locale),
  }));

  return (
    <main className="bg-slate-50/60">
      <RegisterHero />
      <RegisterWizard sectors={sectors} account={account} />
      <BenefitsStrip />
    </main>
  );
}
