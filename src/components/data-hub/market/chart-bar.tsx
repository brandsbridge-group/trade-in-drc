import { useTranslations } from "next-intl";
import { ChartCard } from "./chart-trend";
import { MARKET_COLORS, formatUsdShort } from "./constants";

export interface SectorBar {
  label: string;
  value: number;
}

const X_TICKS = 3;

/** Sector Activity — horizontal navy bars with value labels + x-axis ticks. */
export function ChartBar({ bars }: { bars: SectorBar[] }) {
  const t = useTranslations("MarketIntel.charts.bar");
  const max = Math.max(1, ...bars.map((b) => b.value));

  const ticks = Array.from({ length: X_TICKS + 1 }, (_, i) => {
    const v = (max * i) / X_TICKS;
    return { pct: (i / X_TICKS) * 100, label: formatUsdShort(v) };
  });

  return (
    <ChartCard title={t("title")}>
      <div className="space-y-2.5">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-[0.7rem] text-slate-600" title={b.label}>
              {b.label}
            </span>
            <div className="relative h-4 flex-1 rounded-sm bg-slate-100">
              <div
                className="h-4 rounded-sm"
                style={{
                  width: `${Math.max(2, (b.value / max) * 100)}%`,
                  backgroundColor: MARKET_COLORS.navy,
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[0.7rem] font-semibold text-market-navy">
              {formatUsdShort(b.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between pl-[6.5rem] pr-14 text-[0.65rem] text-slate-400">
        {ticks.map((tick, i) => (
          <span key={i}>{tick.label}</span>
        ))}
      </div>
    </ChartCard>
  );
}
