import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERIES_COLOR } from "@/components/dashboard/overview/activity-chart";
import { OverviewCard } from "@/components/dashboard/overview/overview-card";
import type { FunnelStep } from "@/lib/dashboard/analytics/details";

/* -------------------------------------------------------------------------- */
/* Summary band                                                               */
/* -------------------------------------------------------------------------- */

export interface HeroReading {
  key: string;
  label: string;
  value: string;
  note?: string;
}

interface StatsHeroProps {
  /** Who the page is written for ("Congolese company account"). */
  eyebrow: string;
  icon: LucideIcon;
  /** The period's result in one sentence. */
  headline: string;
  body: string;
  readings: HeroReading[];
}

/**
 * The page's opening statement: one sentence that says what happened over the
 * period, then three figures that back it. Navy, so the KPI row under it stays
 * white (one featured surface per screen).
 */
export function StatsHero({ eyebrow, icon: Icon, headline, body, readings }: StatsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-market-navy px-5 py-6 text-white sm:px-8 sm:py-8">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-market-or/20 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#24508F]/50 blur-3xl" />
      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
        <div className="min-w-0">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-[11.5px] font-medium text-market-or-light ring-1 ring-white/10">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-market-or text-market-navy">
              <Icon className="h-3 w-3" aria-hidden />
            </span>
            <span className="truncate">{eyebrow}</span>
          </p>
          <p className="mt-4 font-display text-[24px] font-semibold leading-[1.15] tracking-tight sm:text-[30px]">{headline}</p>
          <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-white/65">{body}</p>
        </div>
        <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {readings.map((r) => (
            <div key={r.key} className="min-w-0 rounded-2xl bg-white/[0.07] px-4 py-3.5 ring-1 ring-white/10">
              <dt className="text-[11.5px] leading-snug text-white/60">{r.label}</dt>
              <dd className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight tabular-nums">{r.value}</dd>
              {r.note && <dd className="mt-2 text-[11.5px] leading-snug text-market-or-light">{r.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function StatsHeroSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-market-navy px-5 py-6 sm:px-8 sm:py-8">
      <div className="h-6 w-56 rounded-full bg-white/10" />
      <div className="mt-5 h-8 w-3/5 rounded bg-white/10" />
      <div className="mt-3 h-4 w-2/5 rounded bg-white/5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                            */
/* -------------------------------------------------------------------------- */

/** Names a group of cards: a small gold rule, a title, one line of context. */
export function SectionHeading({ id, title, hint, aside }: { id?: string; title: string; hint?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
      <div className="min-w-0">
        <span aria-hidden className="mb-2 block h-[3px] w-8 rounded-full bg-market-or" />
        <h2 id={id} className="font-display text-lg font-semibold tracking-tight text-market-navy">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-slate-500">{hint}</p>}
      </div>
      {aside}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Funnel                                                                     */
/* -------------------------------------------------------------------------- */

interface FunnelCardProps {
  id: string;
  title: string;
  subtitle?: string;
  steps: (FunnelStep & { label: string })[];
  /** "{percent} of the previous step", already localised. */
  shareLabel: (share: number) => string;
  formatNumber: (value: number) => string;
  color?: keyof typeof SERIES_COLOR;
  /** Shown instead of the steps when the first step is empty. */
  empty?: string;
  footer?: ReactNode;
  className?: string;
}

/**
 * Ordered steps, each bar drawn against the first one, with the share that
 * made it from the step before written between the two (never colour alone).
 */
export function FunnelCard({ id, title, subtitle, steps, shareLabel, formatNumber, color = "blue", empty, footer, className }: FunnelCardProps) {
  const base = Math.max(steps[0]?.value ?? 0, 1);
  const isEmpty = (steps[0]?.value ?? 0) === 0;

  return (
    <OverviewCard id={id} title={title} subtitle={subtitle} className={cn("h-full", className)}>
      {isEmpty && empty ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-xs leading-relaxed text-slate-500">{empty}</p>
      ) : (
        <ol>
          {steps.map((step, i) => (
            <li key={step.key}>
              {i > 0 && (
                <p className="flex items-center gap-2 py-1.5 pl-3 text-[11.5px] text-slate-500">
                  <span aria-hidden className="h-4 w-px bg-slate-200" />
                  {step.ofPrevious === null ? "—" : shareLabel(Math.min(step.ofPrevious, 1))}
                </p>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-market-navy">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10.5px] font-semibold tabular-nums text-slate-600">
                    {i + 1}
                  </span>
                  <span className="truncate">{step.label}</span>
                </span>
                <span className="font-display text-lg font-semibold leading-none tabular-nums text-market-navy">{formatNumber(step.value)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-[4px] bg-slate-100" aria-hidden>
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${Math.min(100, Math.max(step.value > 0 ? 2 : 0, (step.value / base) * 100))}%`,
                    backgroundColor: SERIES_COLOR[color],
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      {footer && <div className="mt-4 border-t border-slate-100 pt-3.5">{footer}</div>}
    </OverviewCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Days of the week                                                           */
/* -------------------------------------------------------------------------- */

interface WeekdayCardProps {
  id: string;
  title: string;
  subtitle?: string;
  /** Seven totals, Monday first. */
  totals: number[];
  /** Seven short day names, Monday first. */
  dayLabels: string[];
  /** Seven full day names for the hidden table and the summary. */
  dayNames: string[];
  formatNumber: (value: number) => string;
  /** Sentence naming the strongest day; receives its full name. */
  bestLabel: (day: string) => string;
  empty: string;
  valueHeader: string;
  dayHeader: string;
}

/** Seven columns, one colour, every bar labelled with its value. */
export function WeekdayCard({ id, title, subtitle, totals, dayLabels, dayNames, formatNumber, bestLabel, empty, valueHeader, dayHeader }: WeekdayCardProps) {
  const max = Math.max(...totals, 0);
  const best = max > 0 ? totals.indexOf(max) : -1;

  return (
    <OverviewCard id={id} title={title} subtitle={subtitle} className="h-full">
      {max === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-xs leading-relaxed text-slate-500">{empty}</p>
      ) : (
        <>
          <div className="flex h-36 items-end gap-2" aria-hidden>
            {totals.map((value, i) => (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className={cn("text-[11px] tabular-nums", i === best ? "font-semibold text-market-navy" : "text-slate-500")}>
                  {formatNumber(value)}
                </span>
                <span
                  className="w-full max-w-[34px] rounded-t-[4px]"
                  style={{
                    height: `${Math.max(value > 0 ? 4 : 1.5, (value / max) * 78)}%`,
                    backgroundColor: value > 0 ? SERIES_COLOR.blue : "#E2E8F0",
                    opacity: value > 0 && i !== best ? 0.55 : 1,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2 border-t border-slate-200 pt-1.5" aria-hidden>
            {dayLabels.map((label, i) => (
              <span key={i} className={cn("min-w-0 flex-1 text-center text-[11px]", i === best ? "font-semibold text-market-navy" : "text-slate-400")}>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{bestLabel(dayNames[best])}</p>
          {/* The hiding class sits on a wrapper: a table ignores `width: 1px`. */}
          <div className="sr-only">
            <table>
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">{dayHeader}</th>
                  <th scope="col">{valueHeader}</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((value, i) => (
                  <tr key={i}>
                    <th scope="row">{dayNames[i]}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OverviewCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Meters (a part of a whole)                                                 */
/* -------------------------------------------------------------------------- */

export interface MeterItem {
  key: string;
  label: string;
  value: number;
  total: number;
  /** "18 / 25", already formatted. */
  valueText: string;
}

/** Rows "label — n / total" over a thin track: how complete something is. */
export function MeterList({ items }: { items: MeterItem[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-medium text-market-navy">{item.label}</span>
            <span className="shrink-0 tabular-nums text-slate-600">{item.valueText}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.total > 0 ? Math.max(item.value > 0 ? 2 : 0, Math.min(100, (item.value / item.total) * 100)) : 0}%`,
                backgroundColor: SERIES_COLOR.blue,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Figure rows                                                                */
/* -------------------------------------------------------------------------- */

export interface FigureItem {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
}

/** Icon chip, label and note on the left, the figure on the right. */
export function FigureList({ items }: { items: FigureItem[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map(({ key, icon: Icon, label, value, note }) => (
        <li key={key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-market-navy">{label}</span>
            {note && <span className="block truncate text-[11.5px] text-slate-500">{note}</span>}
          </span>
          <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-market-navy">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Segmented switch                                                           */
/* -------------------------------------------------------------------------- */

interface SegmentedSwitchProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Same control as the period switch, for a choice between a few readings. */
export function SegmentedSwitch<T extends string>({ label, value, options, onChange }: SegmentedSwitchProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs transition-colors",
            value === option.value
              ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200"
              : "text-slate-500 hover:text-market-navy"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
