"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { OfferCard, type OfferCardData } from "@/components/marketplace/products/offer-card";

export interface MarketTab {
  key: string;
  label: string;
  count: number;
  /** Catalogue URL showing every offer of this tab. */
  href: string;
  /** The newest offers of this tab, already limited on the server. */
  cards: OfferCardData[];
}

/**
 * Sector tabs + newest offers. Tabs switch between server-prepared card sets
 * (no refetch); the grid swaps with the §2.4 recipe.
 */
export function HomeMarketGrid({ tabs }: { tabs: MarketTab[] }) {
  const t = useTranslations("HomeMarket");
  const reduce = useReducedMotion();
  const [active, setActive] = useState(tabs[0]?.key ?? "all");
  const tab = tabs.find((x) => x.key === active) ?? tabs[0];
  if (!tab) return null;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t("tabsLabel")}
          className="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:pb-0"
        >
          <div className="flex gap-1 rounded-full bg-slate-100 p-1">
            {tabs.map((x) => {
              const on = x.key === tab.key;
              return (
                <button
                  key={x.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(x.key)}
                  className={cn(
                    "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out",
                    on ? "bg-market-navy text-white shadow-sm" : "text-slate-600 hover:text-[var(--color-landing-navy)]",
                  )}
                >
                  {x.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      on ? "bg-market-or text-market-navy" : "bg-white text-slate-500",
                    )}
                  >
                    {x.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Link
          href={tab.href}
          className="group inline-flex flex-none items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)]"
        >
          {t("seeAll", { count: tab.count })}
          <ArrowRight className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab.key}
          role="tabpanel"
          initial={reduce ? false : { opacity: 0, translateY: 4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={reduce ? undefined : { opacity: 0, translateY: -4 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          className="mt-5"
        >
          {tab.cards.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">{t("empty")}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tab.cards.map((offer, i) => (
                // Two cards below lg, so the grid never leaves one card alone on a row.
                <li key={offer.id} className={i >= 2 ? "hidden lg:block" : undefined}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
