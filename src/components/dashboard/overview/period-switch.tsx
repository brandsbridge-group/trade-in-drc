"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { OVERVIEW_PERIODS, type OverviewPeriod } from "@/lib/dashboard/overview/metrics";

interface PeriodSwitchProps {
  value: OverviewPeriod;
  onChange: (value: OverviewPeriod) => void;
}

/** Segmented 7 / 30 / 90-day control; drives every number on the page. */
export function PeriodSwitch({ value, onChange }: PeriodSwitchProps) {
  const t = useTranslations("DashboardOverview");
  return (
    <div role="group" aria-label={t("periodLabel")} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {OVERVIEW_PERIODS.map((days) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
          className={cn(
            "rounded-md px-3 py-1 text-xs transition-colors",
            value === days
              ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200"
              : "text-slate-500 hover:text-market-navy"
          )}
        >
          {t("periodDays", { days })}
        </button>
      ))}
    </div>
  );
}
