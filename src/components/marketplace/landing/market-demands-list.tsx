"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Inbox,
  MapPin,
  Plus,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type DemandDirection = "import" | "export";

export interface DemandItem {
  id: string;
  href: string;
  title: string;
  kind: "demand" | "quotation";
  direction: DemandDirection;
  buyerName: string | null;
  buyerInitials: string;
  buyerLogo: string | null;
  verified: boolean;
  location: string | null;
  /** Deadline already formatted server-side (fixed zone → no hydration drift). */
  deadline: string | null;
  closesInDays: number | null;
}

const FILTERS = ["all", "import", "export"] as const;
type Filter = (typeof FILTERS)[number];

const VISIBLE = 5;
/** Deadlines this close are flagged in amber. */
const URGENT_DAYS = 7;

/** Import = the brand blue, Export = the marketplace gold. */
const DIRECTION = {
  import: { Icon: ArrowDownRight, pill: "bg-primary/10 text-primary" },
  export: { Icon: ArrowUpRight, pill: "bg-market-or/15 text-market-or-dark" },
} as const;

/** Shared column template: header row and data rows line up on lg+. */
const COLS =
  "lg:grid lg:grid-cols-[minmax(0,2.6fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-6";

/**
 * Open requests as a "row-card" table: a toolbar card (direction segments +
 * actions), a column header, then one floating white row per request. Rows
 * are whole links. Filtering is instant; hover is §2.1 (shadow/ring, arrow
 * nudge, ≤ 150 ms).
 *
 * Responding and browsing all requests need an account: signed-out visitors
 * go to /login with the target in `?redirect=` (validated by
 * resolveSafeRedirect), so they land where they clicked once signed in.
 */
export function MarketDemandsList({
  items,
  signedIn,
}: {
  items: DemandItem[];
  signedIn: boolean;
}) {
  const t = useTranslations("MarketLanding.demands");
  const [filter, setFilter] = useState<Filter>("all");
  const gate = (href: string) =>
    signedIn ? href : `/login?redirect=${encodeURIComponent(href)}`;

  const countFor = (f: Filter) =>
    f === "all" ? items.length : items.filter((d) => d.direction === f).length;
  const shown = items
    .filter((d) => filter === "all" || d.direction === filter)
    .slice(0, VISIBLE);

  return (
    <>
      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-xs ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-1 rounded-xl bg-slate-100 p-1"
          role="group"
          aria-label={t("filterLabel")}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 ease-out sm:flex-none",
                  active
                    ? "bg-[var(--color-landing-navy)] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-[var(--color-landing-navy)]",
                )}
              >
                {t(`filters.${f}`)}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-[11px] tabular-nums",
                    active ? "bg-white/15 text-white" : "bg-white text-slate-500",
                  )}
                >
                  {countFor(f)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Link
            href={gate("/opportunities?category=demand")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold text-[var(--color-landing-navy)] ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:bg-slate-50 sm:flex-none"
          >
            {t("viewAll")}
          </Link>
          <Link
            href="/request"
            className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-market-or px-3 py-2 text-[13px] font-bold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:bg-market-or-dark sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("publish")}
          </Link>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          <Inbox className="h-5 w-5 flex-none text-slate-400" aria-hidden />
          {t("empty")}
        </div>
      ) : (
        <>
          {/* Column header (desktop only — rows are self-describing below lg). */}
          <div
            aria-hidden
            className={cn(
              "mt-5 hidden px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400",
              COLS,
            )}
          >
            <span>{t("columns.demand")}</span>
            <span>{t("columns.direction")}</span>
            <span>{t("columns.location")}</span>
            <span>{t("columns.deadline")}</span>
            <span className="w-[120px]" />
          </div>

          <ul className="mt-3 space-y-2.5 lg:mt-2">
            {shown.map((d) => {
              const dir = DIRECTION[d.direction];
              const urgent = d.closesInDays !== null && d.closesInDays <= URGENT_DAYS;
              return (
                <li key={d.id}>
                  <Link
                    href={gate(d.href)}
                    className={cn(
                      "group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition-[box-shadow] duration-150 ease-out hover:shadow-lg hover:shadow-slate-900/[0.06] hover:ring-slate-300 lg:py-3.5 lg:pr-3.5 lg:pl-5",
                      COLS,
                    )}
                  >
                    {/* Request + buyer */}
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="relative grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-xl bg-market-navy text-[13px] font-bold text-white">
                        {d.buyerLogo ? (
                          // Company logos live on arbitrary hosts — plain img.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.buyerLogo} alt="" className="h-full w-full bg-white object-contain p-1" />
                        ) : (
                          d.buyerInitials
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                          {t(`kinds.${d.kind}`)}
                        </span>
                        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--color-landing-navy)] lg:line-clamp-1">
                          {d.title}
                        </h3>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-slate-500">
                          <span className="truncate">{d.buyerName ?? t("buyer")}</span>
                          {d.verified && (
                            <BadgeCheck
                              className="h-3.5 w-3.5 flex-none text-emerald-600"
                              aria-label={t("buyerVerified")}
                            />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Meta: a wrapping chip row on mobile, three columns on lg. */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:contents">
                      <span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                            dir.pill,
                          )}
                        >
                          <dir.Icon className="h-3.5 w-3.5" aria-hidden />
                          {t(`filters.${d.direction}`)}
                        </span>
                      </span>

                      <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] text-slate-600">
                        <MapPin className="h-3.5 w-3.5 flex-none text-slate-400" aria-hidden />
                        <span className="truncate">{d.location ?? "—"}</span>
                      </span>

                      <span className="inline-flex items-center gap-2.5">
                        <CalendarClock
                          className={cn(
                            "hidden h-4 w-4 flex-none lg:block",
                            urgent ? "text-amber-600" : "text-slate-400",
                          )}
                          aria-hidden
                        />
                        <span className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[var(--color-landing-navy)]">
                            {d.deadline ?? t("noDeadline")}
                          </span>
                          {d.closesInDays !== null && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[11px]",
                                urgent ? "font-semibold text-amber-700" : "text-slate-500",
                              )}
                            >
                              {urgent && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                              )}
                              {t("closesIn", { days: d.closesInDays })}
                            </span>
                          )}
                        </span>
                      </span>
                    </div>

                    {/* Action — the whole row is the link; this is its visual handle. */}
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-[13px] font-bold text-[var(--color-landing-navy)] ring-1 ring-slate-200 transition-colors duration-150 ease-out group-hover:bg-[var(--color-landing-navy)] group-hover:text-white group-hover:ring-transparent lg:w-[120px]">
                      {t("respond")}
                      <ArrowRight
                        className="h-3.5 w-3.5 flex-none transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
