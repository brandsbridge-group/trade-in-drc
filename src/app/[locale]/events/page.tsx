import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { DRC_PROVINCES } from "@/config/provinces";
import type { Locale } from "@/config/locales";
import { EventsHeroSearch, type SelectOption } from "@/components/events/market/hero-search";
import { EventStatTiles } from "@/components/events/market/stat-tiles";
import { FeaturedEvents } from "@/components/events/market/featured-events";
import { UpcomingEvents } from "@/components/events/market/upcoming-events";
import { EventsBySector } from "@/components/events/market/events-by-sector";
import { HostBand } from "@/components/events/market/host-band";
import { PastHighlights } from "@/components/events/market/past-highlights";
import { EventInfoSections, EventRail } from "@/components/events/market/event-rail";
import { loadEventsHubData, parseEventFilters } from "@/components/events/market/event-queries";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const sp = await searchParams;
  const filters = parseEventFilters(sp);

  const supabase = await createServerSupabaseClient();
  const data = await loadEventsHubData(supabase, filters);

  const sectorOptions: SelectOption[] = data.sectors.map((s) => ({
    value: s.id,
    label: pickLocalized(s, "name", locale),
  }));
  const sectorLabelById: Record<string, string> = Object.fromEntries(
    data.sectors.map((s) => [s.id, pickLocalized(s, "name", locale)])
  );

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(15,35,70,0.12),transparent_46%)] pb-12 text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(13,29,62,0.14),transparent_60%)]" />

      <div className="relative">
        <EventsHeroSearch sectorOptions={sectorOptions} provinces={DRC_PROVINCES} />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
            <div className="min-w-0 space-y-10">
              <EventStatTiles upcomingTotal={data.upcomingTotal} sectorCount={data.sectors.length} />
              <FeaturedEvents events={data.featured} locale={locale} />
              <UpcomingEvents
                events={data.upcoming}
                filters={filters}
                locale={locale}
                sectorLabelById={sectorLabelById}
              />
              <EventsBySector sectorCounts={data.sectorCounts} />
              <HostBand />
              <PastHighlights events={data.past} locale={locale} />
            </div>

            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <EventRail sectorOptions={sectorOptions} />
            </aside>
          </div>
          <EventInfoSections />
        </div>
      </div>
    </main>
  );
}
