import { getTranslations } from "next-intl/server";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { SectorHero } from "@/components/sectors/market/sector-hero";
import { SectorCards, type SectorCardData } from "@/components/sectors/market/sector-cards";
import { FeaturedBand, type FeaturedMiniCard } from "@/components/sectors/market/featured-band";
import { SECTOR_BLUEPRINTS } from "@/components/sectors/market/sector-blueprint";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";

/** Fixed fallback slots for the featured band when real categories run short. */
const FEATURED_FALLBACK_KEYS = [
  "miningEquipment",
  "safetyEquipment",
  "engineering",
  "logisticsMining",
  "laboratories",
] as const;
const FEATURED_TILE_COUNT = 5;

interface CategoryRow {
  id: string;
  name_en: string;
  name_fr: string;
  sector_id: string;
}

const PARTNER_TIERS: readonly string[] = [VERIFICATION_TIER.VERIFIED, VERIFICATION_TIER.PREMIUM];

export default async function SectorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "BySector" });
  const tCats = await getTranslations({ locale, namespace: "BySector.featured.categories" });
  const supabase = await createServerSupabaseClient();

  // Real taxonomy + verified companies (only verified companies are public).
  const [{ data: sectorData }, { data: companyData }] = await Promise.all([
    supabase.from("sectors").select("id, name_en"),
    supabase
      .from("companies")
      .select("sector_id, verification_tier, is_premium")
      .eq("status", COMPANY_STATUS.VERIFIED),
  ]);

  const sectors = (sectorData ?? []) as Array<{ id: string; name_en: string }>;
  const companies = (companyData ?? []) as Array<{
    sector_id: string | null;
    verification_tier: string;
    is_premium: boolean;
  }>;

  // Tally companies + verified-partner counts per sector id.
  const companyCounts = new Map<string, number>();
  const partnerCounts = new Map<string, number>();
  for (const c of companies) {
    if (!c.sector_id) continue;
    companyCounts.set(c.sector_id, (companyCounts.get(c.sector_id) ?? 0) + 1);
    if (c.is_premium || PARTNER_TIERS.includes(c.verification_tier)) {
      partnerCounts.set(c.sector_id, (partnerCounts.get(c.sector_id) ?? 0) + 1);
    }
  }

  // Match each design sector to a real taxonomy row by keyword on name_en.
  const matchedIdByKey = new Map<string, string>();
  const cards: SectorCardData[] = SECTOR_BLUEPRINTS.map((bp) => {
    const row = sectors.find((s) => bp.match.test(s.name_en));
    if (row) matchedIdByKey.set(bp.key, row.id);
    return {
      key: bp.key,
      sectorId: row?.id ?? null,
      companies: row ? companyCounts.get(row.id) ?? 0 : 0,
      verifiedPartners: row ? partnerCounts.get(row.id) ?? 0 : 0,
    };
  });

  // Featured band mini-cards: real mining sub-categories where available.
  const miningSectorId = matchedIdByKey.get("mining") ?? null;
  const miniCards = await buildFeaturedMiniCards(supabase, miningSectorId, loc, (key) => tCats(key));

  return (
    <div className="min-h-screen bg-white">
      <BreadcrumbBar
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("breadcrumb.localContacts"), href: "/companies" },
          { label: t("breadcrumb.title") },
        ]}
      />
      <SectorHero title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <SectorCards sectors={cards} />
      <FeaturedBand miniCards={miniCards} />
    </div>
  );
}

/**
 * Build the five featured mini-cards. Uses real mining `categories` (with live
 * product counts) where present, then pads with the design's fallback labels so
 * the band always shows five tiles that mirror the mock.
 */
async function buildFeaturedMiniCards(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  miningSectorId: string | null,
  loc: Locale,
  fallbackLabel: (key: (typeof FEATURED_FALLBACK_KEYS)[number]) => string
): Promise<FeaturedMiniCard[]> {
  const real: FeaturedMiniCard[] = [];

  if (miningSectorId) {
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name_en, name_fr, sector_id")
      .eq("sector_id", miningSectorId)
      .limit(FEATURED_TILE_COUNT);
    const categories = (categoryData ?? []) as CategoryRow[];

    if (categories.length > 0) {
      const { data: productData } = await supabase
        .from("products")
        .select("category_id")
        .in(
          "category_id",
          categories.map((c) => c.id)
        );
      const productCounts = new Map<string, number>();
      for (const p of (productData ?? []) as Array<{ category_id: string | null }>) {
        if (p.category_id) productCounts.set(p.category_id, (productCounts.get(p.category_id) ?? 0) + 1);
      }
      for (const c of categories) {
        real.push({ label: pickLocalized(c, "name", loc), companies: productCounts.get(c.id) ?? 0 });
      }
    }
  }

  // Pad up to five tiles with the design's fallback labels (zero counts).
  const cards = [...real];
  for (let i = cards.length; i < FEATURED_TILE_COUNT; i += 1) {
    cards.push({ label: fallbackLabel(FEATURED_FALLBACK_KEYS[i]), companies: 0 });
  }
  return cards.slice(0, FEATURED_TILE_COUNT);
}
