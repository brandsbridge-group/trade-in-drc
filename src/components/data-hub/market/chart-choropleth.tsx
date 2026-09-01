import { useTranslations } from "next-intl";
import { ChartCard } from "./chart-trend";
import { CHOROPLETH_BUCKET_FILL, type CoverageBucket } from "./constants";
import { DRC_MAP_VIEWBOX, DRC_PROVINCE_PATHS } from "./drc-provinces-geo";

/**
 * Real DRC provincial choropleth — all 26 provinces from geoBoundaries ADM1
 * boundaries (see drc-provinces-geo.ts), each shaded by its REAL coverage
 * bucket (per-company counts). The province selected in the hero filter is
 * outlined in gold.
 */
export function ChartChoropleth({
  buckets,
  active,
}: {
  buckets: Record<string, CoverageBucket>;
  /** Province selected in the hero filter — outlined in gold for connection. */
  active?: string;
}) {
  const t = useTranslations("MarketIntel.charts");
  const legend: CoverageBucket[] = ["high", "medium", "low"];

  return (
    <ChartCard title={t("choropleth.title")}>
      <div className="flex items-center gap-4">
        <svg
          viewBox={DRC_MAP_VIEWBOX}
          role="img"
          aria-label={t("choropleth.title")}
          className="h-40 w-auto"
        >
          {DRC_PROVINCE_PATHS.map((prov) => (
            <path
              key={prov.name}
              d={prov.d}
              fill={CHOROPLETH_BUCKET_FILL[buckets[prov.name] ?? "low"]}
              stroke={active === prov.name ? "#F5B800" : "#fff"}
              strokeWidth={active === prov.name ? 3 : 0.6}
              strokeLinejoin="round"
            >
              <title>{prov.name}</title>
            </path>
          ))}
        </svg>

        <ul className="grid gap-1.5 text-xs text-slate-600">
          {legend.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span
                className="h-3 w-3 flex-none rounded-sm"
                style={{ background: CHOROPLETH_BUCKET_FILL[b] }}
              />
              {t(`choropleth.${b}`)}
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
