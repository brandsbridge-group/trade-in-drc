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
              className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-5 text-center shadow-sm transition-colors duration-150 hover:border-market-navy"
            >
              <Icon className="h-7 w-7 text-market-navy" strokeWidth={1.6} aria-hidden />
              <span className="text-sm font-bold text-market-navy">{t(`tiles.${key}`)}</span>
              <span className="text-xs text-slate-500">
                {entry.count} {t("eventsSuffix")}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
