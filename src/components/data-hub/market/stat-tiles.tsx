import { useTranslations } from "next-intl";
import { Building2, MapPin, PieChart, FileText } from "lucide-react";

export interface StatTileData {
  companies: string;
  provinces: string;
  sectors: string;
  reports: string;
}

const TILES = [
  { key: "companiesMapped", field: "companies", icon: Building2 },
  { key: "provincesCovered", field: "provinces", icon: MapPin },
  { key: "strategicSectors", field: "sectors", icon: PieChart },
  { key: "reportsDatasets", field: "reports", icon: FileText },
] as const;

/** Four dark-circle-icon stat tiles beneath the hero. */
export function StatTiles({ data }: { data: StatTileData }) {
  const t = useTranslations("MarketIntel.stats");
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map(({ key, field, icon: Icon }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-market-navy text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-2xl font-bold leading-none text-market-navy">
              {data[field]}
            </div>
            <div className="mt-1 text-xs text-slate-600">{t(key)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
