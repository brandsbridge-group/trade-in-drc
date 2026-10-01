"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Chart palette, validated with the dataviz validator (light surface): brand-
 * derived steps — a lifted navy and the existing `market-or-dark` gold. The
 * raw brand navy #0B1F3A reads as near-black in a chart and fails the
 * lightness band, so it is kept for text and chrome only.
 */
const SERIES_COLOR = { blue: "#24508F", gold: "#B68B3A" } as const;

export interface ChartSeries {
  key: string;
  label: string;
  color: keyof typeof SERIES_COLOR;
  /** Daily values, oldest first; all series share the same days. */
  values: number[];
  /** Diagonal hatching as a second, non-colour encoding. */
  hatched?: boolean;
}

interface ActivityChartProps {
  title: string;
  subtitle?: string;
  series: ChartSeries[];
  /** ISO date of the first daily value. */
  startDate: string;
}

const DAY_MS = 86_400_000;
/** Plot geometry: 210px tall, the bottom 24px (Tailwind bottom-6) hold the x labels. */
const LABEL_ROW = 24;
const PLOT_BAND = 210 - LABEL_ROW;
/** Up to this many days a bar is one day; beyond, bars are weeks. */
const DAILY_LIMIT = 31;

interface Bucket {
  from: Date;
  to: Date;
  values: number[];
  total: number;
}

function buildBuckets(series: ChartSeries[], startDate: string): Bucket[] {
  const days = series[0]?.values.length ?? 0;
  const size = days > DAILY_LIMIT ? 7 : 1;
  const start = new Date(startDate).getTime();
  const buckets: Bucket[] = [];
  for (let i = 0; i < days; i += size) {
    const end = Math.min(days, i + size);
    const values = series.map((s) => s.values.slice(i, end).reduce((a, b) => a + b, 0));
    buckets.push({
      from: new Date(start + i * DAY_MS),
      to: new Date(start + (end - 1) * DAY_MS),
      values,
      total: values.reduce((a, b) => a + b, 0),
    });
  }
  return buckets;
}

/**
 * Axis maximum for 4 gridline steps, each a clean whole number
 * (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10^n) — never 12.5 or 37.5.
 */
export function niceMax(value: number): number {
  if (value <= 4) return 4;
  const raw = value / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
    .map((m) => m * pow)
    .find((s) => s >= raw && Number.isInteger(s))!;
  return step * 4;
}

function segmentStyle(s: ChartSeries): React.CSSProperties {
  const color = SERIES_COLOR[s.color];
  return s.hatched
    ? { backgroundColor: color, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 7px)" }
    : { backgroundColor: color };
}

/**
 * Stacked bar chart of daily (or weekly) activity. One y-axis, recessive dashed
 * grid, 4px rounded tops, 2px gap between stacked segments, a dark tooltip on
 * hover or keyboard focus, a legend when there are two series, and a visually
 * hidden table carrying the same numbers.
 */
export function ActivityChart({ title, subtitle, series, startDate }: ActivityChartProps) {
  const t = useTranslations("DashboardOverview.chart");
  const format = useFormatter();
  const [active, setActive] = React.useState<number | null>(null);
  const buckets = React.useMemo(() => buildBuckets(series, startDate), [series, startDate]);
  const weekly = (series[0]?.values.length ?? 0) > DAILY_LIMIT;
  const max = niceMax(Math.max(...buckets.map((b) => b.total), 0));
  const ticks = [max, (max * 3) / 4, max / 2, max / 4, 0];
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));
  const total = buckets.reduce((a, b) => a + b.total, 0);
  const days = series[0]?.values.length ?? 0;
  const best = buckets.reduce<Bucket | null>((top, b) => (!top || b.total > top.total ? b : top), null);
  const secondTotal = series[1] ? series[1].values.reduce((a, b) => a + b, 0) : null;

  const dayLabel = (d: Date) => format.dateTime(d, { day: "numeric", month: "short" });
  const bucketLabel = (b: Bucket) => (weekly ? t("weekOf", { date: dayLabel(b.from) }) : dayLabel(b.from));

  return (
    <section aria-labelledby="overview-chart" className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="overview-chart" className="font-display text-base font-semibold text-market-navy">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          <p className="mt-2 font-display text-[26px] font-semibold leading-none tracking-tight text-market-navy tabular-nums">
            {format.number(total)}
            <span className="ml-1.5 font-sans text-xs font-normal text-slate-500">{t("totalLabel")}</span>
          </p>
        </div>
        {series.length > 1 && (
          <ul className="flex flex-wrap gap-3 text-xs text-slate-600" aria-label={t("legend")}>
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={segmentStyle(s)} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-5 mt-5 flex gap-2">
        {/* Y axis */}
        <div className="flex h-[210px] flex-col justify-between pb-6 text-right text-[10.5px] tabular-nums text-slate-400" aria-hidden>
          {ticks.map((v) => (
            <span key={v} className="-translate-y-1/2 leading-none">{format.number(v, { notation: "compact" })}</span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative h-[210px] min-w-0 flex-1" onMouseLeave={() => setActive(null)}>
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden>
            {ticks.map((v) => (
              <span key={v} className={cn("border-t", v === 0 ? "border-slate-200" : "border-dashed border-slate-100")} />
            ))}
          </div>

          <div className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[3px] sm:gap-1.5">
            {buckets.map((b, i) => {
              const dim = active !== null && active !== i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${bucketLabel(b)} : ${series.map((s, j) => `${s.label} ${format.number(b.values[j])}`).join(", ")}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-t-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-or"
                >
                  <span
                    className={cn("flex flex-col-reverse gap-[2px] transition-opacity duration-150", dim && "opacity-35")}
                    style={{ height: `${(b.total / max) * 100}%` }}
                  >
                    {series.map((s, j) =>
                      b.values[j] > 0 ? (
                        <span
                          key={s.key}
                          className="w-full first:rounded-b-[1px] last:rounded-t-[4px]"
                          style={{ ...segmentStyle(s), flexGrow: b.values[j], minHeight: 2 }}
                        />
                      ) : null
                    )}
                  </span>
                  {b.total === 0 && <span className="h-[2px] w-full rounded-full bg-slate-200" />}
                </button>
              );
            })}
          </div>

          {/* X labels */}
          <div className="absolute inset-x-0 bottom-0 flex h-5 gap-[3px] sm:gap-1.5" aria-hidden>
            {buckets.map((b, i) => (
              <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[10.5px] text-slate-400">
                {i % labelEvery === 0 ? dayLabel(b.from) : ""}
              </span>
            ))}
          </div>

          {/* Tooltip */}
          {active !== null && buckets[active] && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 rounded-xl bg-market-navy px-3 py-2 text-xs text-white shadow-lg"
              style={{
                // Centred over the bar, kept inside the plot near the edges.
                left: `clamp(80px, ${((active + 0.5) / buckets.length) * 100}%, calc(100% - 80px))`,
                // Bars sit in the 186px band above the 24px label row; float 8px above the bar.
                bottom: `${(buckets[active].total / max) * PLOT_BAND + LABEL_ROW + 8}px`,
              }}
            >
              <p className="mb-1 font-semibold text-market-or-light">{bucketLabel(buckets[active])}</p>
              {series.map((s, j) => (
                <p key={s.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-white/75">
                    <span className="h-2 w-2 rounded-[2px]" style={segmentStyle(s)} aria-hidden />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums">{format.number(buckets[active].values[j])}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary strip: three readings of the same data, so the card ends on answers. */}
      <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-[11px] text-slate-500">{t("avgPerDay")}</dt>
          <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">
            {format.number(days ? total / days : 0, { maximumFractionDigits: 1 })}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-500">{t(weekly ? "bestWeek" : "bestDay")}</dt>
          <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">
            {best && best.total > 0 ? (
              <>
                {format.number(best.total)}
                <span className="ml-1 font-sans text-xs font-normal text-slate-500">{bucketLabel(best)}</span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {secondTotal !== null && series[1] ? (
          <div>
            <dt className="text-[11px] text-slate-500">{t("share", { label: series[1].label })}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">
              {total ? format.number(secondTotal / total, { style: "percent", maximumFractionDigits: 0 }) : "—"}
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-[11px] text-slate-500">{t("activeDays")}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">
              {series[0]?.values.filter((v) => v > 0).length ?? 0}
              <span className="ml-1 font-sans text-xs font-normal text-slate-500">/ {days}</span>
            </dd>
          </div>
        )}
      </dl>

      {/* Same numbers for screen readers and table lovers. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{weekly ? t("colWeek") : t("colDay")}</th>
            {series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {buckets.map((b, i) => (
            <tr key={i}>
              <th scope="row">{bucketLabel(b)}</th>
              {b.values.map((v, j) => <td key={j}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
