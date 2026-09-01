import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { TrustSummaryCard } from "@/components/trust/trust-summary-card";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import { Link } from "@/i18n/routing";
import { parseVerificationSummary } from "@/lib/trust/verification-summary";
import type { VerificationTier } from "@/lib/trust/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompanyTrustReportPage({
  params,
}: {
  params: Promise<{ locale: string; companySlug: string }>;
}) {
  const { locale, companySlug } = await params;
  const supabase = await createServerSupabaseClient();

  // Primary lookup is by the human-friendly companies.slug column (00017). Older
  // links that still carry the raw company id keep working via a UUID fallback.
  const columns = "id, name, slug, verification_tier, verified_at, verification_summary";
  let query = supabase
    .from("companies")
    .select(columns)
    .eq("status", "verified");
  query = UUID_RE.test(companySlug)
    ? query.eq("id", companySlug)
    : query.eq("slug", companySlug);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[trust.report]", error.code, error.message);
  }
  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "Trust.report" });
  const tier = (data.verification_tier ?? "none") as VerificationTier;
  const summary = parseVerificationSummary(data.verification_summary);
  const linkTarget = data.slug ?? data.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader
        title={t("title", { company: data.name })}
        action={<VerificationBadge tier={tier} />}
      />
      {data.verified_at && (
        <div className="mt-3">
          <PageMeta
            items={[
              {
                value: t("lastUpdated", {
                  date: new Date(data.verified_at).toLocaleDateString(locale),
                }),
              },
            ]}
          />
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="border border-slate-200 rounded-xl p-4 bg-card">
          <TrustSummaryCard summary={summary} locale={locale} />
        </div>
        <Sidecar>
          <Link
            href={`/companies/${linkTarget}`}
            className="block text-center border border-slate-200 rounded-full py-2 text-sm hover:bg-muted/40"
          >
            ← {data.name}
          </Link>
        </Sidecar>
      </div>
    </div>
  );
}
