import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import type { EventRow, EventFilters } from "./event-queries";
import { EVENT_TABS, formatEventDateRange, type EventTab } from "./event-constants";
import { SectionHeading } from "./section-heading";

const UPCOMING_ANCHOR = "upcoming-events";

/** Build an `/events?...` href that preserves active filters but swaps the tab. */
function tabHref(filters: EventFilters, tab: EventTab): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.location) params.set("location", filters.location);
  if (filters.date) params.set("date", filters.date);
  if (tab !== "all") params.set("tab", tab);
  const query = params.toString();
  return `/events${query ? `?${query}` : ""}#${UPCOMING_ANCHOR}`;
}

/**
 * Upcoming Events (design 13): an event-type tab bar (active = navy pill) over a
 * row of compact event cards with colored type label, sector, date, location,
 * organizer, and view / attend CTAs.
 */
export async function UpcomingEvents({
  events,
  filters,
  locale,
  sectorLabelById,
}: {
  events: EventRow[];
  filters: EventFilters;
  locale: Locale;
  sectorLabelById: Record<string, string>;
}) {
  const t = await getTranslations("EventsHub.upcoming");
  const tTabs = await getTranslations("EventsHub.tabs");
  const tType = await getTranslations("EventsHub.eventTypes");

  return (
    <section id={UPCOMING_ANCHOR} className="scroll-mt-24">
      <SectionHeading>{t("heading")}</SectionHeading>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {EVENT_TABS.map((tab) => {
          const active = filters.tab === tab;
          return (
            <Link
              key={tab}
              href={tabHref(filters, tab)}
              className={`inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold transition-colors duration-150 ${
                active
                  ? "bg-market-navy text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-market-navy hover:text-market-navy"
              }`}
            >
              {tTabs(tab)}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const title = pickLocalized(event, "title", locale);
            const dateRange = formatEventDateRange(event.event_start_at, event.event_end_at, locale);
            const sectorLabel = event.sector_id ? sectorLabelById[event.sector_id] : undefined;
            return (
              <article
                key={event.id}
                className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  {event.cover_url && (
                    <Image
                      src={event.cover_url}
                      alt={title}
                      fill
                      sizes="(max-width: 1280px) 50vw, 20vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  {event.event_type && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-market-navy">
                      {tType(event.event_type)}
                    </span>
                  )}
                  <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-slate-900">
                    {title}
                  </h3>
                  {sectorLabel && (
                    <span className="mt-1 text-[11px] font-semibold text-emerald-600">{sectorLabel}</span>
                  )}
                  <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {dateRange && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-market-red" aria-hidden />
                        {dateRange}
                      </span>
                    )}
                    {event.event_location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-market-red" aria-hidden />
                        {event.event_location}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-market-red" aria-hidden />
                        {event.organizer}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-1.5 pt-1">
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-market-navy px-2 text-[11px] font-bold text-market-navy transition-colors duration-150 hover:bg-market-navy hover:text-white"
                    >
                      {t("viewDetails")}
                    </Link>
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-market-red px-2 text-[11px] font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
                    >
                      {t("attend")}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
