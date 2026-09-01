"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Building2, Globe, Scale, Check, Minus, ArrowRight, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumApplyButton } from "./premium-apply-form";
import {
  COMPARE_ROWS,
  formatPlanPrice,
  plansForAudience,
  type PromotionAudience,
  type PromotionPlan,
} from "@/config/promotion-plans";

const TABS = [
  { key: "local" as const, Icon: Building2 },
  { key: "international" as const, Icon: Globe },
  { key: "compare" as const, Icon: Scale },
];

type TabKey = (typeof TABS)[number]["key"];

/**
 * "Promote Your Business in the DRC Market" (customer design 2026-07-28):
 * Local / International / Compare tabs. Local and International each show
 * their own plan cards; Compare puts the two international tiers side by side.
 */
export function PromoteTabs() {
  const t = useTranslations("Premium.promote");
  const [tab, setTab] = React.useState<TabKey>("local");

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
      {/* Tab bar */}
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-3">
        {TABS.map(({ key, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 ease-out",
                active ? "bg-primary/[0.06]" : "hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn("size-6 flex-none", active ? "text-primary" : "text-slate-400")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block font-display text-[15px] font-bold",
                    active ? "text-primary" : "text-market-navy"
                  )}
                >
                  {t(`tabs.${key}.title`)}
                </span>
                <span className="block text-[12px] leading-snug text-slate-500">
                  {t(`tabs.${key}.body`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "compare" ? <ComparePanel /> : <PlansPanel audience={tab} />}
      </div>
    </section>
  );
}

/** Plan cards for one audience. */
function PlansPanel({ audience }: { audience: PromotionAudience }) {
  const t = useTranslations("Premium.promote");
  const plans = plansForAudience(audience);

  return (
    <>
      <h2 className="text-center font-display text-2xl font-bold text-market-navy">
        {t(`panels.${audience}.heading`)}
      </h2>
      <p className="mx-auto mt-1.5 max-w-3xl text-center text-sm text-slate-600">
        {t(`panels.${audience}.body`)}
      </p>

      <div
        className={cn(
          "mt-6 grid gap-5",
          plans.length > 1 ? "lg:grid-cols-2" : "mx-auto max-w-2xl"
        )}
      >
        {plans.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} index={i} />
        ))}
      </div>
    </>
  );
}

function PlanCard({ plan, index }: { plan: PromotionPlan; index: number }) {
  const t = useTranslations("Premium.promote");
  const gold = plan.accent === "gold";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border p-6",
        gold ? "border-market-gold/40 bg-amber-50/40" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white",
            gold ? "bg-market-gold" : "bg-primary"
          )}
        >
          {t("option", { n: index + 1 })}
        </span>
        <span
          className={cn(
            "grid size-12 flex-none place-items-center rounded-full",
            gold ? "bg-white text-market-gold" : "bg-white text-primary"
          )}
        >
          {gold ? (
            <Crown className="size-6" strokeWidth={1.75} aria-hidden />
          ) : (
            <Gem className="size-6" strokeWidth={1.75} aria-hidden />
          )}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-bold text-market-navy">
        {t(`plans.${plan.id}.name`)}
      </h3>
      <p className="mt-1 font-display text-3xl font-extrabold text-market-navy">
        {formatPlanPrice(plan.amountUsd)}
        <span className="ml-1.5 text-sm font-semibold text-slate-500">
          {t("perYear")}
        </span>
      </p>
      <p className="mt-3 border-t border-slate-200 pt-3 text-[13px] leading-snug text-slate-600">
        {t(`plans.${plan.id}.body`)}
      </p>

      <ul className="mt-4 mb-5 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: plan.bullets }, (_, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-slate-700">
            <Check
              className={cn("mt-0.5 size-3.5 flex-none", gold ? "text-market-gold" : "text-primary")}
              strokeWidth={2.5}
              aria-hidden
            />
            {t(`plans.${plan.id}.bullets.${i}`)}
          </li>
        ))}
      </ul>

      {/* mt-auto pins every card's CTA to the same baseline regardless of
          how many bullets the plan has. */}
      <div className="mt-auto">
        <PremiumApplyButton
          plan={plan.id}
          label={t(`plans.${plan.id}.cta`)}
          icon={<ArrowRight className="size-4" aria-hidden />}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-colors duration-150 ease-out",
            gold ? "bg-market-gold hover:bg-yellow-500" : "bg-primary hover:bg-[#003a8c]"
          )}
        />
      </div>

      <p className="mt-3 text-[11.5px] leading-snug text-slate-500">
        <span className="font-semibold text-slate-600">{t("bestFor")}</span>{" "}
        {t(`plans.${plan.id}.bestFor`)}
      </p>
    </article>
  );
}

/** Feature matrix comparing the two international tiers. */
function ComparePanel() {
  const t = useTranslations("Premium.promote");

  const cell = (v: boolean | string, gold: boolean) => {
    if (v === true)
      return (
        <Check
          className={cn("mx-auto size-4", gold ? "text-market-gold" : "text-primary")}
          strokeWidth={3}
          aria-hidden
        />
      );
    if (v === false) return <Minus className="mx-auto size-4 text-slate-300" aria-hidden />;
    return (
      <span className={cn("text-[12px] font-semibold", gold ? "text-market-gold" : "text-primary")}>
        {t(`compareValues.${v}`)}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-display text-xl font-bold text-market-navy">
        {t("compare.heading")}
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2.5 text-left text-[13px] font-semibold text-slate-500" />
              <th className="px-3 py-2.5 text-center font-display text-[13px] font-bold text-primary">
                {t("plans.international.name")}
              </th>
              <th className="px-3 py-2.5 text-center font-display text-[13px] font-bold text-market-gold">
                {t("plans.international_strategic.name")}
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-3 text-[12.5px] text-slate-700">
                  {t(`compareRows.${row.key}`)}
                </td>
                <td className="px-3 py-2.5 text-center">{cell(row.visibility, false)}</td>
                <td className="px-3 py-2.5 text-center">{cell(row.strategic, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
