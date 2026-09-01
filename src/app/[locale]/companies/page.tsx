import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { DirectoryHero } from "@/components/companies/market/directory-hero";
import { BadgeExplainer } from "@/components/companies/market/badge-explainer";
import {
  DirectoryFilterBar,
  type SectorOption,
} from "@/components/companies/market/filter-bar";
import {
  DirectorySort,
  DIRECTORY_SORT,
  type DirectorySortValue,
} from "@/components/companies/market/directory-sort";
import {
  CompanyCard,
  type DirectoryCompany,
} from "@/components/companies/market/company-card";
import { VerificationApproach } from "@/components/companies/market/verification-approach";

const RESULT_LIMIT = 12;

interface CompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
  is_premium: boolean;
  city: string | null;
  province: string | null;
  sector_id: string | null;
  created_at: string;
}

interface SectorRow {
  id: string;
  name_en: string | null;
  name_fr: string | null;
  name_tr: string | null;
  name_zh: string | null;
  name_es: string | null;
}

export default async function CompaniesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "VerifiedDirectory" });
  const supabase = await createServerSupabaseClient();

  const sectorId = sp.sector;
  const region = sp.region;
  const tier = sp.tier;
  const premiumOnly = sp.premium === "1";
  const sort: DirectorySortValue =
    sp.sort === DIRECTORY_SORT.AZ ? DIRECTORY_SORT.AZ : DIRECTORY_SORT.RECENT;

  // Sectors — for the filter dropdown and to label each card.
  const { data: sectorData } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr, name_tr, name_zh, name_es");
  const sectorRows = (sectorData ?? []) as unknown as SectorRow[];
  const sectorLabelById = new Map<string, string>(
    sectorRows.map((s) => [s.id, pickLocalized(s, "name", locale as Locale)])
  );
  const sectorOptions: SectorOption[] = sectorRows
    .map((s) => ({ id: s.id, label: sectorLabelById.get(s.id) ?? "" }))
    .filter((s) => s.label.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  // Active filters, computed once and applied to both the count and list
  // queries. Note: `type` (partnership) and `intl` (international-ready) are
  // captured by the filter bar but have no backing column yet — the gap
  // analysis flags both as unmodeled — so they are intentionally not queried.
  const eqPairs: Array<[string, string]> = [["status", COMPANY_STATUS.VERIFIED]];
  if (sectorId) eqPairs.push(["sector_id", sectorId]);
  if (region) eqPairs.push(["province", region]);
  if (tier && tier !== "any") eqPairs.push(["verification_tier", tier]);
  const orFilter = premiumOnly
    ? `verification_tier.eq.${VERIFICATION_TIER.PREMIUM},is_premium.eq.true`
    : null;

  let countQuery = supabase
    .from("companies")
    .select("id", { count: "exact", head: true });
  for (const [column, value] of eqPairs) countQuery = countQuery.eq(column, value);
  if (orFilter) countQuery = countQuery.or(orFilter);
  const { count } = await countQuery;
  const total = count ?? 0;

  let listQuery = supabase
    .from("companies")
    .select(
      "id, name, logo_url, description, verification_tier, is_premium, city, province, sector_id, created_at"
    );
  for (const [column, value] of eqPairs) listQuery = listQuery.eq(column, value);
  if (orFilter) listQuery = listQuery.or(orFilter);
  listQuery =
    sort === DIRECTORY_SORT.AZ
      ? listQuery.order("name", { ascending: true })
      : listQuery.order("created_at", { ascending: false });

  const { data } = await listQuery.limit(RESULT_LIMIT);
  const rows = (data ?? []) as unknown as CompanyRow[];

  const companies: DirectoryCompany[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    logo_url: r.logo_url,
    description: r.description,
    verification_tier: r.verification_tier,
    is_premium: r.is_premium,
    city: r.city,
    province: r.province,
    sectorLabel: r.sector_id ? sectorLabelById.get(r.sector_id) ?? "" : "",
  }));

  const cardLabels = {
    verifiedPill: t("verifiedPill"),
    premiumPill: t("premiumPill"),
    viewProfile: t("viewProfile"),
  };

  const from = total === 0 ? 0 : 1;
  const to = companies.length;

  return (
    <>
      <BreadcrumbBar
        items={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbLocalContacts"), href: "/companies" },
          { label: t("breadcrumbCurrent") },
        ]}
      />

      <DirectoryHero locale={locale} />

      <div className="bg-slate-50">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-16 md:px-6">
          <BadgeExplainer locale={locale} />

          <div className="mt-8">
            <DirectoryFilterBar sectors={sectorOptions} />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {t("showingResults", { from, to, total })}
            </p>
            <DirectorySort value={sort} />
          </div>

          {companies.length === 0 ? (
            <p className="mt-10 rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {t("noResults")}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} labels={cardLabels} />
              ))}
            </div>
          )}

          <div className="mt-12">
            <VerificationApproach locale={locale} />
          </div>
        </div>
      </div>
    </>
  );
}
