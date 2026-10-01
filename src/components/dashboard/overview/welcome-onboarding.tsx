"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const STEPS = ["account", "company", "documents", "product"] as const;

/**
 * Dashboard home for an account without a company: a guided path instead of
 * counters stuck at zero. Step 1 (the account) is done by definition.
 */
export function WelcomeOnboarding() {
  const t = useTranslations("DashboardOverview.welcome");
  const current = 1;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section aria-labelledby="overview-welcome" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="rounded-xl bg-market-navy p-4 text-white">
          <h2 id="overview-welcome" className="font-display text-lg font-semibold">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <ol className="mt-4">
          {STEPS.map((step, i) => {
            const done = i < current;
            const isCurrent = i === current;
            return (
              <li
                key={step}
                className={cn(
                  "relative flex gap-3 pb-4 last:pb-0",
                  isCurrent && "-mx-2 mb-2 rounded-xl bg-market-cream px-2 py-3"
                )}
              >
                <span
                  className={cn(
                    "z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold",
                    done && "border-emerald-600 bg-emerald-600 text-white",
                    isCurrent && "border-market-or bg-white text-market-navy",
                    !done && !isCurrent && "border-slate-200 bg-white text-slate-400"
                  )}
                  aria-hidden
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div>
                  <p className={cn("text-sm font-semibold", done ? "text-slate-400 line-through" : "text-market-navy")}>
                    <span className="sr-only">{done ? t("doneSr") : isCurrent ? t("currentSr") : ""} </span>
                    {t(`steps.${step}.title`)}
                  </p>
                  <p className="text-xs text-slate-500">{t(`steps.${step}.body`)}</p>
                  {isCurrent && (
                    <Link
                      href="/register-company"
                      className="mt-2 inline-flex rounded-lg bg-market-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-market-navy/90"
                    >
                      {t("start")}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
        <BarChart3 className="h-6 w-6 text-slate-300" aria-hidden />
        <p className="text-sm font-semibold text-market-navy">{t("statsTitle")}</p>
        <p className="max-w-xs text-xs text-slate-500">{t("statsBody")}</p>
      </div>
    </div>
  );
}
