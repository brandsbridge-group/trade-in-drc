import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { MapPanel } from "@/components/provinces/market/map-panel";
import { ProvinceList } from "@/components/provinces/market/province-list";
import {
  FeaturedBand,
  type RecommendedCompany,
} from "@/components/provinces/market/featured-band";
import { FEATURED_PROVINCE } from "@/components/provinces/market/key-provinces";

const RECOMMENDED_LIMIT = 3;

interface SectorRow {
  id: string;
  name_en: string | null;
  name_fr: string | null;
  name_tr: string | null;
  name_zh: string | null;
  name_es: string | null;
}

interface RecommendedRow {
  id: string;
  name: string;
  sector_id: string | null;
  verification_tier: string | null;
}

function isVerifiedTier(tier: string | null): boolean {
  return tier === VERIFICATION_TIER.VERIFIED || tier === VERIFICATION_TIER.PREMIUM;
}

export default async function ProvincesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ByProvince" });
  const supabase = await createServerSupabaseClient();

  // Sector labels — to render the recommended-company category.
  const { data: sectorData } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr, name_tr, name_zh, name_es");
  const sectorLabelById = new Map<string, string>(
    ((sectorData ?? []) as unknown as SectorRow[]).map((s) => [
      s.id,
      pickLocalized(s, "name", locale as Locale),
    ])
  );

  // Per-province verified company counts.
  const { data: provinceData } = await supabase
    .from("companies")
    .select("province")
    .eq("status", COMPANY_STATUS.VERIFIED);
  const countByProvince = new Map<string, number>();
  for (const row of (provinceData ?? []) as { province: string | null }[]) {
    if (!row.province) continue;
    countByProvince.set(row.province, (countByProvince.get(row.province) ?? 0) + 1);
  }

  // Global totals.
  const { count: totalCompanies } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true });
  const { count: verifiedCompanies } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("status", COMPANY_STATUS.VERIFIED);

  // Recommended verified companies in Lualaba (fall back to any verified).
  const { data: lualabaData } = await supabase
    .from("companies")
    .select("id, name, sector_id, verification_tier")
    .eq("status", COMPANY_STATUS.VERIFIED)
    .eq("province", FEATURED_PROVINCE)
    .limit(RECOMMENDED_LIMIT);
  let recRows = (lualabaData ?? []) as unknown as RecommendedRow[];
  if (recRows.length < RECOMMENDED_LIMIT) {
    const { data: fallbackData } = await supabase
      .from("companies")
      .select("id, name, sector_id, verification_tier")
      .eq("status", COMPANY_STATUS.VERIFIED)
      .limit(RECOMMENDED_LIMIT);
    const seen = new Set(recRows.map((r) => r.id));
    for (const r of (fallbackData ?? []) as unknown as RecommendedRow[]) {
      if (recRows.length >= RECOMMENDED_LIMIT) break;
      if (!seen.has(r.id)) recRows = [...recRows, r];
    }
  }
  const recommended: RecommendedCompany[] = recRows.map((r) => ({
    id: r.id,
    name: r.name,
    sectorLabel: r.sector_id ? sectorLabelById.get(r.sector_id) ?? "" : "",
    verified: isVerifiedTier(r.verification_tier),
  }));

  return (
    <div className="bg-slate-50">
      <BreadcrumbBar
        items={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbLocalContacts"), href: "/local-contacts" },
          { label: t("breadcrumbCurrent") },
        ]}
      />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-market-navy md:text-[1.75rem]">
          {t("title")}
        </h1>
        <p className="mt-1 mb-4 text-sm text-slate-500">{t("subtitle")}</p>

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_1.05fr]">
          <MapPanel
            locale={locale}
            totalCompanies={totalCompanies ?? 0}
            verifiedCompanies={verifiedCompanies ?? 0}
          />
          <ProvinceList locale={locale} countByProvince={countByProvince} />
        </div>

        <div className="mt-4" />
        <FeaturedBand
          locale={locale}
          lualabaCount={countByProvince.get(FEATURED_PROVINCE) ?? 0}
          recommended={recommended}
        />
      </div>
    </div>
  );
}
