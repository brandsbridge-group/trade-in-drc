import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { SECTOR_TILES } from "./event-constants";
import { SectionHeading } from "./section-heading";

/**
 * Events by Sector (design 13): eight sector tiles with real per-sector event
 * counts. Each tile deep-links to the filtered events list.
 */
export async function EventsBySector({
  sectorCounts,
}: {
  sectorCounts: Record<string, { count: number; sectorId: string | null }>;
}) {
  const t = await getTranslations("EventsHub.bySector");

  return (
    <section>
      <SectionHeading>{t("heading")}</SectionHeading>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SECTOR_TILES.map(({ key, Icon }) => {
          const entry = sectorCounts[key] ?? { count: 0, sectorId: null };
          const href = entry.sectorId ? `/events?sector=${entry.sectorId}` : "/events";
          return (
            <Link
              key={key}
              href={href}
              className="group relative flex min-h-[152px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-3 py-5 text-center shadow-[0_14px_34px_-28px_rgba(15,23,42,0.5)] transition-all duration-150 hover:-translate-y-0.5 hover:border-market-navy/30 hover:shadow-[0_20px_38px_-26px_rgba(15,23,42,0.55)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-market-navy transition-colors duration-150 group-hover:bg-market-navy group-hover:text-white">
                <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-market-navy">{t(`tiles.${key}`)}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {entry.count} {t("eventsSuffix")}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
