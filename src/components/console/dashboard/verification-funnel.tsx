"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";
import { SERIES_COLOR } from "@/components/dashboard/overview/activity-chart";
import { OverviewCard } from "@/components/dashboard/overview/overview-card";
import type { ConsoleDashboardMetrics } from "@/lib/console/dashboard-metrics";

interface VerificationFunnelProps {
  funnel: ConsoleDashboardMetrics["funnel"];
  reviews: ConsoleDashboardMetrics["reviews"];
}

const STEPS = ["registered", "submitted", "verified"] as const;

/**
 * Registered → file sent → verified: where companies drop out of the
 * verification circuit, then what staff decided over the period and how fast.
 */
export function VerificationFunnel({ funnel, reviews }: VerificationFunnelProps) {
  const t = useTranslations("Admin.dashboard.funnel");
  const format = useFormatter();
  const base = Math.max(funnel.registered, 1);
  const hours = reviews.median_decision_hours;

  return (
    <OverviewCard
      id="console-funnel"
      title={t("title")}
      subtitle={t("subtitle")}
      footerLink={{ href: ROUTES.CONSOLE_VERIFICATIONS, label: t("viewAll") }}
      className="h-full"
    >
      <ol className="space-y-3.5">
        {STEPS.map((step, i) => {
          const value = funnel[step];
          const previous = i === 0 ? null : funnel[STEPS[i - 1]];
          return (
            <li key={step}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-market-navy">{t(`steps.${step}`)}</span>
                <span className="flex items-baseline gap-2">
                  {previous !== null && previous > 0 && (
                    <span className="text-[11.5px] text-slate-500">
                      {t("ofPrevious", { percent: format.number(value / previous, { style: "percent", maximumFractionDigits: 0 }) })}
                    </span>
                  )}
                  <span className="font-display text-lg font-semibold leading-none tabular-nums text-market-navy">{format.number(value)}</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-[4px] bg-slate-100" aria-hidden>
                <div
                  className="h-full rounded-[4px]"
                  style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / base) * 100)}%`, backgroundColor: SERIES_COLOR.blue }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        {(["to_review", "awaiting_owner", "rejected"] as const).map((key) => (
          <div key={key}>
            <dt className="text-[11px] leading-tight text-slate-500">{t(`stock.${key}`)}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">{format.number(funnel[key])}</dd>
          </div>
        ))}
      </dl>

      <dl className="mt-3 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-slate-500">{t("decisions")}</dt>
          <dd className="text-right font-medium text-market-navy">
            {t("decisionsValue", { approved: reviews.approved, rejected: reviews.rejected, moreInfo: reviews.more_info })}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-slate-500">{t("medianDelay")}</dt>
          <dd className="font-medium tabular-nums text-market-navy">
            {hours === null
              ? "—"
              : hours < 48
                ? t("hours", { value: format.number(hours, { maximumFractionDigits: 1 }) })
                : t("days", { value: format.number(hours / 24, { maximumFractionDigits: 1 }) })}
          </dd>
        </div>
      </dl>
    </OverviewCard>
  );
}
