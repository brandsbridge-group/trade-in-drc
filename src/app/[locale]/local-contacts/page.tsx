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
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,35,70,0.08),transparent_42%)] text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(13,29,62,0.12),transparent_60%)]" />

      <div className="relative">
        <LocalContactsHero sectors={sectorOptions} />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 md:py-8">
          <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-3 shadow-[0_30px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-sm">
            <ContactTypeCards />
            <LocalSectorCards sectors={sectorCards} />
          </div>
        </div>

        <ValueStrip />
        <CtaBand />
      </div>
    </div>
  );
}
