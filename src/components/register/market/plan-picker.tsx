"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { findPlan, formatPlanPrice } from "@/config/promotion-plans";
import type { PlanId, PlanMeta } from "./constants";
import { SectionHeader } from "./field-kit";

interface Props {
  plans: readonly PlanMeta[];
  selected: PlanId;
  onSelect: (plan: PlanId) => void;
  /**
   * i18n namespace (under `RegisterCompany`) holding this path's plan copy —
   * "tiers" for the Congolese ladder, "intl.plan" for the international one.
   * Kept separate so a $3,000 Congolese label can never leak onto a $3,600
   * international card, or vice versa (P1-5, P1-6).
   */
  namespace: "tiers" | "intl.plan";
}

/**
 * P2-2: the one plan step both paths share, second-to-last before Review.
 * Extracted from the old always-visible `tier-cards.tsx` (Congolese only)
 * and `step-intl-profile-plan.tsx` (international only) — merging them
 * means the pricing panel can never again simply disappear when an
 * applicant switches profile (P1-4), and each path still only ever renders
 * its own tier list (Congolese never sees "verified" bleed into the
 * international ladder, P1-5).
 */
export function PlanPicker({ plans, selected, onSelect, namespace }: Props) {
  const t = useTranslations("RegisterCompany");
  const congolese = namespace === "tiers";

  const heading = congolese ? t("sections.plan") : t("intl.plan.heading");
  const subheading = congolese ? t("tiers.subheading") : t("intl.plan.subheading");

  /** International premium's price is sourced from the shared promotion-plan
   *  config (so it can never drift from the DB CHECK constraint) instead of
   *  a static i18n string, mirroring the deleted step-intl-profile-plan.tsx. */
  const priceFor = (id: PlanId): { price: string; period?: string } => {
    if (!congolese && id === "premium") {
      return {
        price: formatPlanPrice(findPlan("international")!.amountUsd),
        period: t("intl.plan.perYear"),
      };
    }
    return {
      price: t(`${namespace}.${id}.price`),
      period: id === "premium" && congolese ? t("tiers.premium.period") : undefined,
    };
  };

  return (
    <div>
      <SectionHeader icon={CreditCard} title={heading} tight />
      {subheading && <p className="mb-4 text-sm text-slate-600">{subheading}</p>}

      <div
        className={cn(
          "grid gap-4",
          plans.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
        )}
      >
        {plans.map(({ id, icon: Icon, cta, bulletCount }) => {
          const isActive = selected === id;
          const { price, period } = priceFor(id);
          const blurbKey = `${namespace}.${id}.blurb`;
          const hasBlurb = t.has(blurbKey);
          const bullets = Array.from({ length: bulletCount }, (_, i) =>
            t(`${namespace}.${id}.bullets.${i}`)
          );

          return (
            <div
              key={id}
              className={cn(
                "flex flex-col overflow-hidden rounded-[0.5rem] border bg-white shadow-sm transition-shadow duration-150",
                isActive
                  ? "border-market-navy ring-2 ring-market-navy"
                  : "border-slate-200 hover:shadow-md"
              )}
            >
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="size-7 shrink-0 text-market-navy" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {t(`${namespace}.${id}.name`)}
                      </p>
                      <p className="font-display text-xl font-bold text-market-navy">
                        {price}
                        {period && (
                          <span className="ml-1 text-xs font-medium text-slate-500">
                            {period}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-market-navy text-white">
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </div>

                {hasBlurb && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {t(blurbKey)}
                  </p>
                )}

                <ul className="mt-4 mb-5 space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-market-navy"
                        aria-hidden
                      />
                      {b}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-pressed={isActive}
                  className={cn(
                    "mt-auto inline-flex h-11 w-full items-center justify-center rounded-[0.5rem] text-sm font-bold transition-colors duration-150",
                    cta === "solid"
                      ? "bg-market-navy text-white hover:bg-market-navy-deep"
                      : "border border-market-navy text-market-navy hover:bg-market-navy/5"
                  )}
                >
                  {isActive
                    ? t(`${namespace}.selected`)
                    : t(`${namespace}.${id}.cta`)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
