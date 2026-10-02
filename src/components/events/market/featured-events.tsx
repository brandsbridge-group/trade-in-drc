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
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-30px_rgba(15,23,42,0.65)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_46px_-30px_rgba(15,23,42,0.55)]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,#e8edf4,#f8fafc)]">
                {event.cover_url && (
                  <Image
                    src={event.cover_url}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                )}
                {event.event_type && (
                  <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/95 px-3 py-1 text-[11px] font-bold text-market-navy shadow-sm backdrop-blur-sm">
                    {tType(event.event_type)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold leading-snug text-market-navy">{title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                  {dateRange && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-market-red" aria-hidden />
                      {dateRange}
                    </span>
                  )}
                  {event.event_location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-market-red" aria-hidden />
                      {event.event_location}
                    </span>
                  )}
                </div>
                {excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{excerpt}</p>}
                <div className="mt-auto flex gap-2 pt-5">
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-market-navy transition-colors duration-150 hover:border-market-navy hover:bg-market-navy hover:text-white"
                  >
                    {t("viewEvent")}
                  </Link>
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-market-red px-3 text-xs font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
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
