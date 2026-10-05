"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Inbox, MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { DemandItem } from "@/components/marketplace/landing/market-demands-list";

export interface NoticeItem {
  id: string;
  href: string;
  title: string;
  /** Localized category label (tender, PPP, …). */
  category: string;
  issuer: string | null;
  location: string | null;
  /** Compact amount already formatted on the server. */
  budget: string | null;
  closesInDays: number | null;
}

type Tab = "demands" | "notices";

/** Deadlines this close are flagged in amber. */
const URGENT_DAYS = 7;

/** Import = brand blue, Export = marketplace gold (same as the market table). */
const DIRECTION = {
  import: { Icon: ArrowDownRight, pill: "bg-primary/10 text-primary" },
  export: { Icon: ArrowUpRight, pill: "bg-market-or/15 text-market-or-dark" },
} as const;

/** Shared column template: header and rows line up on lg+. */
const COLS =
  "lg:grid lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] lg:items-center lg:gap-5";

/**
 * Two tabs over one compact table: buyers' purchase requests and open
 * tenders / projects. Responding to a request needs an account, so signed-out
 * visitors go through /login?redirect= and land back on the request.
 */
export function HomeDemandsBoard({
  demands,
  demandsTotal,
  notices,
  noticesTotal,
  signedIn,
}: {
  demands: DemandItem[];
  demandsTotal: number;
  notices: NoticeItem[];
  noticesTotal: number;
  signedIn: boolean;
}) {
  const t = useTranslations("HomeDemands");
  const tMarket = useTranslations("MarketLanding.demands");
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("demands");
  const gate = (href: string) => (signedIn ? href : `/login?redirect=${encodeURIComponent(href)}`);

  const tabs: { key: Tab; count: number }[] = [
    { key: "demands", count: demandsTotal },
    { key: "notices", count: noticesTotal },
  ];
  const seeAll =
    tab === "demands"
      ? { href: gate("/opportunities?category=demand"), label: t("viewAllDemands") }
      : { href: "/opportunities", label: t("viewAllNotices") };

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1 self-start rounded-full bg-slate-200/60 p-1">
          {tabs.map(({ key, count }) => {
            const on = key === tab;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out",
                  on ? "bg-market-navy text-white shadow-sm" : "text-slate-600 hover:text-[var(--color-landing-navy)]",
                )}
              >
                {t(`tabs.${key}`)}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    on ? "bg-market-or text-market-navy" : "bg-white text-slate-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Link
          href={seeAll.href}
          className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-market-or-dark transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)]"
        >
          {seeAll.label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          initial={reduce ? false : { opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={reduce ? undefined : { opacity: 0, translateY: -4 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          className="mt-4 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70"
        >
          {/* Column header (desktop only). */}
          <div
            aria-hidden
            className={cn(
              "hidden border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400",
              COLS,
            )}
          >
            <span>{tab === "demands" ? t("columns.request") : t("columns.notice")}</span>
            <span>{tab === "demands" ? t("columns.type") : t("columns.budget")}</span>
            <span>{t("columns.location")}</span>
            <span>{t("columns.deadline")}</span>
            <span className="w-[92px]" />
          </div>

          {tab === "demands" ? (
            demands.length === 0 ? (
              <Empty label={t("emptyDemands")} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {demands.map((d) => {
                  const dir = DIRECTION[d.direction];
                  return (
                    <Row key={d.id} href={gate(d.href)} action={t("respond")}>
                      <Title
                        title={d.title}
                        badge={
                          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", dir.pill)}>
                            <dir.Icon className="h-3 w-3" aria-hidden />
                            {tMarket(`filters.${d.direction}`)}
                          </span>
                        }
                        sub={
                          <>
                            <span className="truncate">{d.buyerName ?? tMarket("buyer")}</span>
                            {d.verified && (
                              <BadgeCheck className="h-3.5 w-3.5 flex-none text-emerald-600" aria-label={tMarket("buyerVerified")} />
                            )}
                          </>
                        }
                      />
                      <Meta>
                        <Cell>{tMarket(`kinds.${d.kind}`)}</Cell>
                        <Location value={d.location} />
                        <Deadline days={d.closesInDays} />
                      </Meta>
                    </Row>
                  );
                })}
              </ul>
            )
          ) : notices.length === 0 ? (
            <Empty label={t("emptyNotices")} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {notices.map((n) => (
                <Row key={n.id} href={n.href} action={t("view")}>
                  <Title
                    title={n.title}
                    badge={
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {n.category}
                      </span>
                    }
                    sub={<span className="truncate">{n.issuer ?? t("issuerUnknown")}</span>}
                  />
                  <Meta>
                    <Cell>{n.budget ?? <span className="text-slate-400">{t("undisclosed")}</span>}</Cell>
                    <Location value={n.location} />
                    <Deadline days={n.closesInDays} />
                  </Meta>
                </Row>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Row({ href, action, children }: { href: string; action: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex flex-col gap-2.5 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-slate-50/80",
          COLS,
        )}
      >
        {children}
        <span className="inline-flex w-full items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--color-landing-navy)] ring-1 ring-inset ring-slate-300 transition-colors duration-150 ease-out group-hover:bg-market-navy group-hover:text-white group-hover:ring-transparent sm:w-auto sm:self-start lg:w-[92px]">
          {action}
        </span>
      </Link>
    </li>
  );
}

function Title({ title, badge, sub }: { title: string; badge: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 lg:flex-nowrap">
        <h3 className="line-clamp-2 text-sm font-semibold text-[var(--color-landing-navy)] lg:truncate">{title}</h3>
        <span className="flex-none">{badge}</span>
      </div>
      <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

/** Meta cells: one wrapping row on mobile, three grid columns on lg. */
function Meta({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 lg:contents">{children}</div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] text-slate-700">{children}</span>;
}

function Location({ value }: { value: string | null }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[13px] text-slate-600">
      <MapPin className="h-3.5 w-3.5 flex-none text-slate-400" aria-hidden />
      <span className="truncate">{value ?? "—"}</span>
    </span>
  );
}

function Deadline({ days }: { days: number | null }) {
  const t = useTranslations("HomeDemands");
  if (days === null) return <Cell>{t("noDeadline")}</Cell>;
  if (days <= URGENT_DAYS) {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        {t("urgent", { days })}
      </span>
    );
  }
  return <Cell>{t("closesIn", { days })}</Cell>;
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-8 text-sm text-slate-500">
      <Inbox className="h-5 w-5 flex-none text-slate-400" aria-hidden />
      {label}
    </div>
  );
}
