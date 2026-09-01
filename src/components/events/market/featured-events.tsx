import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CalendarDays, MapPin } from "lucide-react";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import type { EventRow } from "./event-queries";
import { formatEventDateRange } from "./event-constants";
import { SectionHeading } from "./section-heading";

/**
 * Featured Events (design 13): three large cards for `featured`-tagged events —
 * cover with a red type badge, title, date range, location, excerpt, and
 * view / register CTAs.
 */
export async function FeaturedEvents({
  events,
  locale,
}: {
  events: EventRow[];
  locale: Locale;
}) {
  if (events.length === 0) return null;
  const t = await getTranslations("EventsHub.featured");
  const tType = await getTranslations("EventsHub.eventTypes");

  return (
    <section>
      <SectionHeading>{t("heading")}</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const title = pickLocalized(event, "title", locale);
          const excerpt = pickLocalized(event, "excerpt", locale);
          const dateRange = formatEventDateRange(event.event_start_at, event.event_end_at, locale);
          return (
            <article
              key={event.id}
              className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                {event.cover_url && (
                  <Image
                    src={event.cover_url}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
                {event.event_type && (
                  <span className="absolute right-2 top-2 rounded bg-market-red px-2 py-1 text-[11px] font-bold text-white">
                    {tType(event.event_type)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-lg font-bold leading-snug text-market-navy">{title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  {dateRange && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-market-red" aria-hidden />
                      {dateRange}
                    </span>
                  )}
                  {event.event_location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-market-red" aria-hidden />
                      {event.event_location}
                    </span>
                  )}
                </div>
                {excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{excerpt}</p>}
                <div className="mt-4 flex gap-2 pt-1">
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-market-navy px-3 text-xs font-bold text-market-navy transition-colors duration-150 hover:bg-market-navy hover:text-white"
                  >
                    {t("viewEvent")}
                  </Link>
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-market-red px-3 text-xs font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
                  >
                    {t("register")}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
