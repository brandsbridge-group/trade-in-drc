import { getTranslations } from "next-intl/server";
import { CalendarClock, Layers, MapPin, Handshake } from "lucide-react";
import {
  approxPlus,
  PROVINCES_COVERED,
  INTERNATIONAL_PARTNERS_LABEL,
} from "./event-constants";

/**
 * Four headline stat tiles under the hero (design 13). Upcoming count and
 * sector count are live; provinces + partners are fixed platform figures. Icon
 * chips alternate navy / gold.
 */
export async function EventStatTiles({
  upcomingTotal,
  sectorCount,
}: {
  upcomingTotal: number;
  sectorCount: number;
}) {
  const t = await getTranslations("EventsHub.stats");

  const tiles = [
    { Icon: CalendarClock, value: approxPlus(upcomingTotal), label: t("upcoming"), gold: false },
    { Icon: Layers, value: String(sectorCount), label: t("sectors"), gold: true },
    { Icon: MapPin, value: String(PROVINCES_COVERED), label: t("provinces"), gold: false },
    { Icon: Handshake, value: INTERNATIONAL_PARTNERS_LABEL, label: t("partners"), gold: true },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(({ Icon, value, label, gold }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              gold ? "bg-market-gold text-market-navy" : "bg-market-navy text-white"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <div className="font-display text-xl font-bold leading-tight text-market-navy">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
