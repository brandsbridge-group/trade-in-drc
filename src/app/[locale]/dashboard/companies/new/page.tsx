import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { RegisterWizard, type RegisterAccount } from "@/components/register/market/register-wizard";
import type { SectorOption } from "@/components/register/market/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RegisterCompany" });
  return { title: t("meta.title") };
}

/**
 * Add a company — dashboard-only (the public /register-company now just
 * forwards here). Profile gate → short 2–3 step form. The session is
 * guaranteed by the dashboard layout and the proxy, which also keeps staff
 * accounts out of this area; the account's e-mail, name and phone prefill the
 * contact step.
 */
export default async function NewCompanyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RegisterCompany" });

  const supabase = await createServerSupabaseClient();
  const [rawSectors, { data: auth }] = await Promise.all([listSectorOptions(supabase), supabase.auth.getUser()]);

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
    <div className="mx-auto max-w-[900px] space-y-4 pt-2">
      <header>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("dashboard.back")}
        </Link>
        <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("dashboard.subtitle")}</p>
      </header>
      <RegisterWizard sectors={sectors} account={account} />
    </div>
  );
}
