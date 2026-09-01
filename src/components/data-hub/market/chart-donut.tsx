import { useTranslations } from "next-intl";
import { ChartCard } from "./chart-trend";
import { DONUT_SEGMENT_COLORS } from "./constants";

export interface DonutSegment {
  label: string;
  pct: number;
}

const RADIUS = 42;
const STROKE = 18;
const CIRC = 2 * Math.PI * RADIUS;

/** Companies by Sector — SVG donut with legend (% per sector) + center count. */
export function ChartDonut({
  segments,
  centerValue,
}: {
  segments: DonutSegment[];
  centerValue: string;
}) {
  const t = useTranslations("MarketIntel.charts.donut");

  // Cumulative length of all prior segments (no render-time mutation).
  const priorLen = (idx: number) =>
    segments.slice(0, idx).reduce((sum, s) => sum + (s.pct / 100) * CIRC, 0);
  const arcs = segments.map((seg, i) => {
    const len = (seg.pct / 100) * CIRC;
    return {
      color: DONUT_SEGMENT_COLORS[i % DONUT_SEGMENT_COLORS.length],
      dash: `${len} ${CIRC - len}`,
      // Start at 12 o'clock: rotate -90deg baseline, then advance by prior offset.
      dashoffset: -priorLen(i),
    };
  });

  return (
    <ChartCard title={t("title")}>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={t("title")}>
            <circle cx={60} cy={60} r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={60}
                cy={60}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={arc.dash}
                strokeDashoffset={arc.dashoffset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-base font-bold leading-none text-market-navy">
              {centerValue}
            </span>
            <span className="text-[0.6rem] text-slate-500">{t("center")}</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1 text-[0.7rem]">
          {segments.map((seg, i) => (
            <li key={seg.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    DONUT_SEGMENT_COLORS[i % DONUT_SEGMENT_COLORS.length],
                }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-600">
                {seg.label}
              </span>
              <span className="font-semibold text-market-navy">
                {Math.round(seg.pct)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
