"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Eye,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import { EmptyState } from "@/components/design";
import { cn } from "@/lib/utils";
import type {
  AnalyticsTrend,
  NewsFeedItem,
  TopSearchEntry,
} from "@/lib/analytics/queries";

const PERCENT_LOCALE_FALLBACK = "en";

function localizedName(
  locale: string,
  en: string | null,
  fr: string | null
): string | null {
  if (locale.startsWith("fr")) return fr ?? en;
  return en ?? fr;
}

/* -------------------------------------------------------------------------- */
/* Loading + metric cards                                                     */
/* -------------------------------------------------------------------------- */

export function MetricCardSkeleton() {
  return (
    <div className="bg-card border border-slate-200 rounded-xl p-3 animate-pulse space-y-2">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-8 w-16 bg-muted rounded" />
      <div className="h-3 w-20 bg-muted rounded" />
    </div>
  );
}

interface TrendBadgeProps {
  trend: AnalyticsTrend;
  /** Already-localized strings for the three trend states. */
  labels: {
    up: (pct: string) => string;
    down: (pct: string) => string;
    flat: string;
    noBaseline: string;
  };
}

function TrendBadge({ trend, labels }: TrendBadgeProps) {
  const locale = useLocale();
  const percentFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale || PERCENT_LOCALE_FALLBACK, {
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  if (trend.changePct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" aria-hidden />
        {labels.noBaseline}
      </span>
    );
  }

  if (trend.changePct === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" aria-hidden />
        {labels.flat}
      </span>
    );
  }

  const isUp = trend.changePct > 0;
  const pct = percentFormatter.format(Math.abs(trend.changePct));
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isUp ? "text-emerald-600" : "text-rose-600"
      )}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {isUp ? labels.up(pct) : labels.down(pct)}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  trend: AnalyticsTrend;
  icon: React.ElementType;
  trendLabels: TrendBadgeProps["labels"];
}

export function MetricCard({ label, trend, icon: Icon, trendLabels }: MetricCardProps) {
  const locale = useLocale();
  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat(locale || PERCENT_LOCALE_FALLBACK),
    [locale]
  );

  return (
    <div className="bg-card border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </span>
        <Icon className="w-4 h-4 text-muted-foreground" aria-hidden />
      </div>
      <span className="text-2xl font-bold">{numberFormatter.format(trend.total)}</span>
      <div className="mt-1">
        <TrendBadge trend={trend} labels={trendLabels} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Top search entries                                                          */
/* -------------------------------------------------------------------------- */

interface TopSearchEntriesProps {
  entries: TopSearchEntry[];
  title: string;
  subtitle: string;
  appearancesLabel: (count: string) => string;
  emptyTitle: string;
  emptyBody: string;
}

export function TopSearchEntriesCard({
  entries,
  title,
  subtitle,
  appearancesLabel,
  emptyTitle,
  emptyBody,
}: TopSearchEntriesProps) {
  const locale = useLocale();
  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat(locale || PERCENT_LOCALE_FALLBACK),
    [locale]
  );
  const maxAppearances = entries.reduce((max, e) => Math.max(max, e.appearances), 0);

  return (
    <section className="bg-card border border-slate-200 rounded-xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" aria-hidden />
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title={emptyTitle}
          body={emptyBody}
        />
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const name = localizedName(locale, entry.nameEn, entry.nameFr);
            const width =
              maxAppearances > 0
                ? Math.max(8, Math.round((entry.appearances / maxAppearances) * 100))
                : 0;
            return (
              <li key={`${entry.entityType}-${entry.entityId}`} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">
                    {name ?? entry.entityId}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {appearancesLabel(numberFormatter.format(entry.appearances))}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 motion-safe:transition-[width] motion-safe:duration-300"
                    style={{ width: `${width}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* News & events feed                                                          */
/* -------------------------------------------------------------------------- */

interface NewsFeedProps {
  items: NewsFeedItem[];
  title: string;
  subtitle: string;
  newsLabel: string;
  eventLabel: string;
  emptyTitle: string;
  emptyBody: string;
}

export function NewsFeedCard({
  items,
  title,
  subtitle,
  newsLabel,
  eventLabel,
  emptyTitle,
  emptyBody,
}: NewsFeedProps) {
  const locale = useLocale();
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale || PERCENT_LOCALE_FALLBACK, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  function formatDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return dateFormatter.format(date);
  }

  return (
    <section className="bg-card border border-slate-200 rounded-xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-muted-foreground" aria-hidden />
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="w-6 h-6" />}
          title={emptyTitle}
          body={emptyBody}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const isEvent = item.type === "event";
            const title = localizedName(locale, item.titleEn, item.titleFr) ?? "";
            const excerpt = localizedName(locale, item.excerptEn, item.excerptFr);
            const dateValue = isEvent ? item.eventStartAt ?? item.publishedAt : item.publishedAt;
            const dateLabel = formatDate(dateValue);
            const href = isEvent
              ? `/events/${item.slug}`
              : `/news/${item.slug}`;
            return (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={href}
                  className="group flex items-start justify-between gap-3 rounded-lg -mx-1 px-1 py-0.5 motion-safe:transition-colors motion-safe:duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          isEvent
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {isEvent ? (
                          <CalendarDays className="w-3 h-3" aria-hidden />
                        ) : (
                          <Newspaper className="w-3 h-3" aria-hidden />
                        )}
                        {isEvent ? eventLabel : newsLabel}
                      </span>
                      {dateLabel && (
                        <span className="text-[11px] text-muted-foreground">{dateLabel}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{title}</p>
                    {excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{excerpt}</p>
                    )}
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export { Eye };
