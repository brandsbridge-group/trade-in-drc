import { useTranslations } from "next-intl";
import { MARKET_COLORS, formatUsdShort } from "./constants";

export interface TrendPoint {
  label: string;
  exports: number;
  imports: number;
}

const VIEW_W = 340;
const VIEW_H = 190;
const PAD_L = 34;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 26;
const Y_TICKS = 4;

/** Trade Value Trend — dual line (exports navy, imports red) over N months. */
export function ChartTrend({ series }: { series: TrendPoint[] }) {
  const t = useTranslations("MarketIntel.charts.trend");

  const chartW = VIEW_W - PAD_L - PAD_R;
  const chartH = VIEW_H - PAD_T - PAD_B;
  const maxVal = Math.max(
    1,
    ...series.map((p) => Math.max(p.exports, p.imports))
  );

  const xFor = (i: number) =>
    series.length <= 1
      ? PAD_L
      : PAD_L + (chartW * i) / (series.length - 1);
  const yFor = (v: number) => PAD_T + chartH - (chartH * v) / maxVal;

  const line = (key: "exports" | "imports") =>
    series.map((p, i) => `${xFor(i)},${yFor(p[key])}`).join(" ");

  const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, i) => {
    const v = (maxVal * i) / Y_TICKS;
    return { v, y: yFor(v), label: formatUsdShort(v) };
  });

  // Label every other month to avoid crowding.
  const xLabelStep = series.length > 7 ? 2 : 1;

  return (
    <ChartCard title={t("title")}>
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-500">
        <LegendDot color={MARKET_COLORS.navy} label={t("exports")} />
        <LegendDot color={MARKET_COLORS.red} label={t("imports")} />
      </div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={t("title")}
        className="w-full"
      >
        {yTicks.map((tick) => (
          <g key={tick.v}>
            <line
              x1={PAD_L}
              x2={VIEW_W - PAD_R}
              y1={tick.y}
              y2={tick.y}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
            <text x={PAD_L - 6} y={tick.y + 3} textAnchor="end" fontSize={8} fill="#94A3B8">
              {tick.label}
            </text>
          </g>
        ))}
        <polyline
          points={line("exports")}
          fill="none"
          stroke={MARKET_COLORS.navy}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={line("imports")}
          fill="none"
          stroke={MARKET_COLORS.red}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((p, i) => (
          <circle key={`e${i}`} cx={xFor(i)} cy={yFor(p.exports)} r={2.4} fill={MARKET_COLORS.navy} />
        ))}
        {series.map((p, i) => (
          <circle key={`i${i}`} cx={xFor(i)} cy={yFor(p.imports)} r={2.4} fill={MARKET_COLORS.red} />
        ))}
        {series.map((p, i) =>
          i % xLabelStep === 0 ? (
            <text
              key={`l${i}`}
              x={xFor(i)}
              y={VIEW_H - 8}
              textAnchor="middle"
              fontSize={7.5}
              fill="#94A3B8"
            >
              {p.label}
            </text>
          ) : null
        )}
      </svg>
    </ChartCard>
  );
}

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-market-navy">{title}</h3>
      {children}
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
