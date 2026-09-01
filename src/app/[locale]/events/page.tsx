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
import { EventRail } from "@/components/events/market/event-rail";
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
    <main className="bg-slate-50 pb-12">
      <EventsHeroSearch sectorOptions={sectorOptions} provinces={DRC_PROVINCES} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-10">
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

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <EventRail sectorOptions={sectorOptions} />
          </aside>
        </div>
      </div>
    </main>
  );
}
