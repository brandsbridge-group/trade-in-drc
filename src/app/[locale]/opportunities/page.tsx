import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { listBoardOpportunities, listSectorOptions } from "@/lib/opportunities/queries";
import { categoriesForTab, isOpportunityTab } from "@/lib/opportunities/board-config";
import { OppHero } from "@/components/opportunities/market/opp-hero";
import { OppStatsCard } from "@/components/opportunities/market/opp-stats-card";
import { OppPostCard } from "@/components/opportunities/market/opp-post-card";
import { OppBoard } from "@/components/opportunities/market/opp-board";
import { OppNeedForm } from "@/components/opportunities/market/opp-need-form";
import { OppWhyPanel } from "@/components/opportunities/market/opp-why-panel";

/** How many rows the board shows before "View More". */
const BOARD_LIMIT = 8;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Opportunities.page" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Opportunities board — customer design 2: photo hero with a 4-field search,
 * live stats, a tabbed "Latest Opportunities" list (real published rows joined
 * to their company), and a conversion rail (Post a Business Opportunity,
 * Submit Your Business Need, Why Use). Reuses the shared navy/red/gold system.
 */
export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; q?: string; sector?: string; region?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const supabase = await createServerSupabaseClient();

  const rawSectors = await listSectorOptions(supabase);
  const sectors = rawSectors.map((s) => ({ id: s.id, label: pickLocalized(s, "name", locale as Locale) }));
  const sectorLabels = new Map(sectors.map((s) => [s.id, s.label] as const));

  const activeTab = isOpportunityTab(sp.tab) ? sp.tab : "all";
  const activeSector = sp.sector && sectors.some((s) => s.id === sp.sector) ? sp.sector : undefined;
  const keyword = (sp.q ?? "").trim() || undefined;
  const region = (sp.region ?? "").trim() || undefined;

  const { data } = await listBoardOpportunities(supabase, {
    categories: categoriesForTab(activeTab),
    sectorId: activeSector,
    region,
    keyword,
    limit: BOARD_LIMIT + 1,
  });
  const items = data.slice(0, BOARD_LIMIT);
  const hasMore = data.length > BOARD_LIMIT;

  return (
    <div className="bg-slate-50">
      <OppHero sectors={sectors} />
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <OppStatsCard />
          <OppBoard
            items={items}
            locale={locale}
            activeTab={activeTab}
            current={{ q: keyword, sector: activeSector, region }}
            sectorLabels={sectorLabels}
            hasMore={hasMore}
          />
        </div>
        <div className="space-y-4">
          <OppPostCard />
          <OppNeedForm sectors={sectors} />
          <OppWhyPanel />
        </div>
      </div>
    </div>
  );
}
