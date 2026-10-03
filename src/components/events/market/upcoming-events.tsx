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

      <div className="mb-5 flex flex-wrap gap-2">
        {EVENT_TABS.map((tab) => {
          const active = filters.tab === tab;
          return (
            <Link
              key={tab}
              href={tabHref(filters, tab)}
              className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold transition-colors duration-150 ${
                active
                  ? "bg-market-navy text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-market-navy/40 hover:bg-slate-50 hover:text-market-navy"
              }`}
            >
              {tTabs(tab)}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
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
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-30px_rgba(15,23,42,0.65)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_46px_-30px_rgba(15,23,42,0.55)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#e8edf4,#f8fafc)]">
                  {event.cover_url && (
                    <Image
                      src={event.cover_url}
                      alt={title}
                      fill
                      sizes="(max-width: 1280px) 50vw, 20vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {event.event_type && (
                    <span className="w-fit rounded-full bg-market-navy/5 px-2.5 py-1 text-[10px] font-bold text-market-navy">
                      {tType(event.event_type)}
                    </span>
                  )}
                  <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-slate-900">
                    {title}
                  </h3>
                  {sectorLabel && (
                    <span className="mt-1 text-[11px] font-semibold text-emerald-700">{sectorLabel}</span>
                  )}
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    {dateRange && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-market-or-dark" aria-hidden />
                        {dateRange}
                      </span>
                    )}
                    {event.event_location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-market-or-dark" aria-hidden />
                        {event.event_location}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-market-or-dark" aria-hidden />
                        {event.organizer}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-market-navy transition-colors duration-150 hover:border-market-navy hover:bg-market-navy hover:text-white"
                    >
                      {t("viewDetails")}
                    </Link>
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-market-or px-2 text-[11px] font-bold text-market-navy transition-colors duration-150 hover:bg-market-or-light"
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
