import { LocalContactsHero } from "@/components/local-contacts/market/local-contacts-hero";
import { ContactTypeCards } from "@/components/local-contacts/market/contact-type-cards";
import {
  LocalSectorCards,
  LOCAL_SECTOR_BLUEPRINTS,
  type LocalSectorCardData,
} from "@/components/local-contacts/market/local-sector-cards";
import { ValueStrip } from "@/components/local-contacts/market/value-strip";
import { CtaBand } from "@/components/local-contacts/market/cta-band";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { COMPANY_STATUS } from "@/constants/status";

/**
 * Local Contacts hub (customer design 3) — a marketing, search-forward landing
 * that feeds the companies directory. Root of the vertical, so no breadcrumb.
 * Sector cards carry real per-sector verified-company counts.
 */
export default async function LocalContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const supabase = await createServerSupabaseClient();

  const [{ data: sectorData }, { data: companyData }] = await Promise.all([
    supabase.from("sectors").select("id, name_en, name_fr, name_tr, name_zh, name_es"),
    supabase
      .from("companies")
      .select("sector_id")
      .eq("status", COMPANY_STATUS.VERIFIED),
  ]);

  // Cast via `unknown`: name_tr/name_zh/name_es exist in prod (migration 00027)
  // but predate the checked-in generated types.
  const sectors = (sectorData ?? []) as unknown as Array<
    { id: string; name_en: string } & Record<string, string>
  >;
  const companies = (companyData ?? []) as Array<{ sector_id: string | null }>;

  // Tally verified companies per sector id.
  const companyCounts = new Map<string, number>();
  for (const c of companies) {
    if (!c.sector_id) continue;
    companyCounts.set(c.sector_id, (companyCounts.get(c.sector_id) ?? 0) + 1);
  }

  // Match each design sector to a real taxonomy row by keyword on name_en.
  const sectorCards: LocalSectorCardData[] = LOCAL_SECTOR_BLUEPRINTS.map((bp) => {
    const row = sectors.find((s) => bp.match.test(s.name_en));
    return {
      key: bp.key,
      sectorId: row?.id ?? null,
      companies: row ? companyCounts.get(row.id) ?? 0 : 0,
    };
  });

  // Localized sector options for the hero search dropdown.
  const sectorOptions = sectors.map((s) => ({
    id: s.id,
    label: pickLocalized(s, "name", loc),
  }));

  return (
    <div className="min-h-screen bg-white">
      <LocalContactsHero sectors={sectorOptions} />
      <ContactTypeCards />
      <LocalSectorCards sectors={sectorCards} />
      <ValueStrip />
      <CtaBand />
    </div>
  );
}
