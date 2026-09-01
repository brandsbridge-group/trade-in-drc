import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { OpportunityForm } from "../opportunity-form";
import { PageHeader } from "@/components/design";
import { listSectorOptions } from "@/lib/opportunities/queries";
import { COMPANY_STATUS } from "@/constants/status";

export default async function NewOpportunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/${locale}/login?next=/dashboard/opportunities/new`);

  // Only verified companies may post opportunities (Req 13 / spec gating).
  // RLS additionally enforces ownership + email-verification at write time;
  // this server gate keeps unverified owners out of the form entirely.
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, status")
    .eq("owner_id", auth.user.id)
    .eq("status", COMPANY_STATUS.VERIFIED);

  const verifiedCompanies = (companies ?? []).map((c) => ({ id: c.id, name: c.name }));

  if (verifiedCompanies.length === 0) {
    return (
      <div className="max-w-4xl space-y-4">
        <PageHeader title={t("dashboard.new")} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium text-amber-800">{t("gate.verificationRequiredTitle")}</p>
          <p className="mt-1 text-amber-700">
            {t("gate.verificationRequiredBody")}{" "}
            <Link href="/dashboard/companies" className="underline text-primary">
              {t("gate.checkStatus")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const sectors = await listSectorOptions(supabase);

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title={t("dashboard.new")} />
      <OpportunityForm mode="create" companies={verifiedCompanies} sectors={sectors} />
    </div>
  );
}
