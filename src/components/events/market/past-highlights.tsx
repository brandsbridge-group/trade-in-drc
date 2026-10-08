import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import type { EventRow } from "./event-queries";
import { SectionHeading } from "./section-heading";

/**
 * Past Highlights (design 13): three horizontal cards (small cover left, title +
 * excerpt right) for `past`-tagged events.
 */
export async function PastHighlights({
  events,
  locale,
}: {
  events: EventRow[];
  locale: Locale;
}) {
  if (events.length === 0) return null;
  const t = await getTranslations("EventsHub.past");

  return (
    <section>
      <SectionHeading>{t("heading")}</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const title = pickLocalized(event, "title", locale);
          const excerpt = pickLocalized(event, "excerpt", locale);
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group flex gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_38px_-26px_rgba(15,23,42,0.5)]"
            >
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#e8edf4,#f8fafc)]">
                {event.cover_url && (
                  <Image src={event.cover_url} alt={title} fill sizes="112px" className="object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                )}
              </div>
              <div className="min-w-0 py-1">
                <h3 className="font-display text-sm font-bold leading-snug text-market-navy">{title}</h3>
                {excerpt && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">{excerpt}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
