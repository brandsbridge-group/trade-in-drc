"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/lib/dashboard/overview/metrics";

export interface KpiDelta {
  direction: TrendDirection;
  /** Text shown in the pill, already formatted ("18 %", "0,4 pt", "6"). */
  text: string;
}

interface KpiTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: KpiDelta | null;
  series?: { values: number[]; startDate: string };
  footnote?: string;
  /** The tile the page wants read first (navy, gold accents). */
  highlight?: boolean;
}

const DELTA_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus, new: ArrowUpRight } as const;
const MINI_BARS = 12;

/** Folds a daily series into at most {@link MINI_BARS} buckets (sums), keeping the latest day last. */
export function bucketSeries(values: number[], buckets = MINI_BARS): number[] {
  if (values.length <= buckets) return values;
  const size = Math.ceil(values.length / buckets);
  const out: number[] = [];
  for (let end = values.length; end > 0; end -= size) {
    out.unshift(values.slice(Math.max(0, end - size), end).reduce((a, b) => a + b, 0));
  }
  return out;
}

/**
 * Mini bar trend for a stat tile: shape only (the number carries the value).
 * The latest bucket is solid, earlier ones recessive. Hover gives each bucket's
 * total through a native tooltip.
 */
function MiniBars({ values, startDate, days, highlight, label }: {
  values: number[];
  startDate: string;
  days: number;
  highlight?: boolean;
  label: string;
}) {
  const format = useFormatter();
  const bars = bucketSeries(values);
  const max = Math.max(...bars, 1);
  const perBar = Math.ceil(days / bars.length);
  const start = new Date(startDate).getTime();

  return (
    <div role="img" aria-label={label} className="flex h-10 items-end gap-[3px]">
      {bars.map((v, i) => {
        const last = i === bars.length - 1;
        const from = new Date(start + i * perBar * 86_400_000);
        return (
          <span
            key={i}
            title={`${format.dateTime(from, { day: "numeric", month: "short" })} : ${format.number(v)}`}
            className={cn(
              "w-[7px] rounded-t-[3px]",
              highlight
                ? last ? "bg-market-or" : "bg-white/20"
                : last ? "bg-market-navy" : "bg-slate-200"
            )}
            style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

/**
 * Premium stat tile: label, icon chip, big number, change versus the previous
 * period (icon + sign, never colour alone) and a mini bar trend.
 */
export function KpiTile({ icon: Icon, label, value, delta, series, footnote, highlight }: KpiTileProps) {
  const t = useTranslations("DashboardOverview");
  const DeltaIcon = delta ? DELTA_ICON[delta.direction] : null;

  return (
    <div
      className={cn(
        "relative flex min-h-[150px] flex-col overflow-hidden rounded-2xl p-4",
        highlight ? "bg-market-navy text-white" : "bg-white ring-1 ring-slate-200/70"
      )}
    >
      {highlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-market-or/20 blur-2xl"
        />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <p className={cn("text-[13px] font-medium", highlight ? "text-white/75" : "text-slate-500")}>{label}</p>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full",
            highlight ? "bg-market-or text-market-navy" : "bg-slate-100 text-market-navy"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="relative mt-auto flex items-end justify-between gap-3 pt-3">
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-[30px] font-semibold leading-none tracking-tight tabular-nums",
              highlight ? "text-white" : "text-market-navy"
            )}
          >
            {value}
          </p>
          {delta && DeltaIcon ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
                  delta.direction === "down"
                    ? highlight ? "bg-red-400/20 text-red-200" : "bg-red-50 text-red-700"
                    : delta.direction === "flat"
                      ? highlight ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-600"
                      : highlight ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                )}
              >
                <DeltaIcon className="h-3 w-3" aria-hidden />
                <span className="sr-only">{t(`deltaSr.${delta.direction}`)} </span>
                {delta.text}
              </span>
              <span className={highlight ? "text-white/55" : "text-slate-400"}>{t("vsPrevious")}</span>
            </p>
          ) : footnote ? (
            <p className={cn("mt-2.5 text-[11.5px] leading-snug", highlight ? "text-market-or-light" : "text-slate-500")}>
              {footnote}
            </p>
          ) : null}
        </div>
        {series && series.values.length > 1 && (
          <MiniBars
            values={series.values}
            startDate={series.startDate}
            days={series.values.length}
            highlight={highlight}
            label={t("sparklineLabel", { label, days: series.values.length })}
          />
        )}
      </div>
      {delta && footnote && (
        <p className={cn("relative mt-3 border-t pt-2.5 text-[11.5px]", highlight ? "border-white/10 text-market-or-light" : "border-slate-100 text-slate-500")}>
          {footnote}
        </p>
      )}
    </div>
  );
}

export function KpiTileSkeleton() {
  return (
    <div className="min-h-[150px] animate-pulse rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-9 w-9 rounded-full bg-slate-100" />
      </div>
      <div className="mt-8 h-8 w-24 rounded bg-slate-100" />
      <div className="mt-3 h-3 w-32 rounded bg-slate-50" />
    </div>
  );
}
