"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BadgeCheck, BarChart3, Building2, Check, FileCheck2, Globe2, Package, Timer, UserRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { OnboardingModel, OnboardingStep, OnboardingStepKey } from "@/lib/dashboard/overview/onboarding";

const STEP_ICON: Record<OnboardingStepKey, LucideIcon> = {
  account: UserRound,
  company: Building2,
  documents: FileCheck2,
  product: Package,
};

const BENEFITS: { key: "visible" | "verified" | "stats"; icon: LucideIcon }[] = [
  { key: "visible", icon: Globe2 },
  { key: "verified", icon: BadgeCheck },
  { key: "stats", icon: BarChart3 },
];

/** Progress as a ring: the share of steps done, with "n/total" in the middle. */
function ProgressRing({ model, size, onNavy = false }: { model: OnboardingModel; size: number; onNavy?: boolean }) {
  const stroke = size >= 100 ? 9 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={onNavy ? "stroke-white/10" : "stroke-slate-200"} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={onNavy ? "stroke-market-or" : "stroke-market-or-dark"}
          strokeDasharray={`${(model.percent / 100) * c} ${c}`}
        />
      </svg>
      <span className={cn("font-display font-semibold tabular-nums", size >= 100 ? "text-2xl" : "text-[11px]", onNavy ? "text-white" : "text-market-navy")}>
        {model.doneCount}/{model.total}
      </span>
    </div>
  );
}

function StepMarker({ step, index }: { step: OnboardingStep; index: number }) {
  return (
    <span
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
        step.state === "done" && "bg-emerald-100 text-emerald-700",
        step.state === "current" && "bg-market-navy text-white",
        step.state === "upcoming" && "bg-slate-100 text-slate-400"
      )}
      aria-hidden
    >
      {step.state === "done" ? <Check className="h-3.5 w-3.5" /> : index + 1}
    </span>
  );
}

interface OnboardingGuideProps {
  model: OnboardingModel;
  /** `welcome`: the whole home of an account without a company. `progress`: a card above an established home. */
  variant: "welcome" | "progress";
}

/**
 * Getting-started path (account → company → documents → first product),
 * driven by {@link OnboardingModel} so each step ticks when it is really done.
 * Shown until every step is; the caller hides it once `model.complete`.
 */
export function OnboardingGuide({ model, variant }: OnboardingGuideProps) {
  const t = useTranslations("DashboardOverview.onboarding");
  const current = model.current;
  const srState = (step: OnboardingStep) =>
    step.state === "done" ? t("doneSr") : step.state === "current" ? t("currentSr") : t("upcomingSr");

  if (variant === "progress") {
    return (
      <section aria-labelledby="overview-onboarding" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center gap-3.5">
          <ProgressRing model={model} size={46} />
          <div className="min-w-0 flex-1">
            <h2 id="overview-onboarding" className="font-display text-base font-semibold text-market-navy">{t("progressTitle")}</h2>
            <p className="text-xs text-slate-500">{t("progressSub", { done: model.doneCount, total: model.total })}</p>
          </div>
          {current?.href && (
            <Link
              href={current.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              {t(`steps.${current.key}.cta`)}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>
        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {model.steps.map((step, i) => (
            <li
              key={step.key}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5",
                step.state === "current" ? "bg-market-cream ring-1 ring-market-or/40" : "bg-slate-50"
              )}
            >
              <StepMarker step={step} index={i} />
              <span className="min-w-0">
                <span className="sr-only">{srState(step)} </span>
                <span className={cn("block truncate text-[13px] font-semibold", step.state === "upcoming" ? "text-slate-500" : "text-market-navy")}>
                  {t(`steps.${step.key}.title`)}
                </span>
                <span className="block truncate text-[11.5px] text-slate-500">
                  {t(step.state === "done" ? `steps.${step.key}.done` : `steps.${step.key}.body`)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section aria-labelledby="overview-onboarding" className="relative overflow-hidden rounded-3xl bg-market-navy p-6 text-white sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-market-or/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1 basis-[280px]">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-market-or-light ring-1 ring-white/15">
              {t("eyebrow")}
            </p>
            <h2 id="overview-onboarding" className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{t("subtitle")}</p>
            {current?.href && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={current.href}
                  className="inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-market-navy transition-colors hover:bg-market-or-light"
                >
                  {t(`steps.${current.key}.cta`)}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                  <Timer className="h-3.5 w-3.5" aria-hidden />
                  {t(`steps.${current.key}.time`)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing model={model} size={112} onNavy />
            <p className="max-w-[9rem] text-xs leading-relaxed text-white/60">{t("ringCaption", { done: model.doneCount, total: model.total })}</p>
          </div>
        </div>
      </section>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {model.steps.map((step, i) => {
          const Icon = STEP_ICON[step.key];
          const isCurrent = step.state === "current";
          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1",
                isCurrent ? "ring-2 ring-market-navy" : "ring-slate-200/70"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full",
                    step.state === "done" && "bg-emerald-50 text-emerald-700",
                    isCurrent && "bg-market-navy text-market-or-light",
                    step.state === "upcoming" && "bg-slate-100 text-slate-400"
                  )}
                  aria-hidden
                >
                  {step.state === "done" ? <Check className="h-[18px] w-[18px]" /> : <Icon className="h-[18px] w-[18px]" />}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {t("stepLabel", { n: i + 1 })}
                </span>
              </div>
              <p className={cn("mt-3 text-sm font-semibold", step.state === "upcoming" ? "text-slate-500" : "text-market-navy")}>
                <span className="sr-only">{srState(step)} </span>
                {t(`steps.${step.key}.title`)}
              </p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
                {t(step.state === "done" ? `steps.${step.key}.done` : `steps.${step.key}.body`)}
              </p>
              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  step.state === "done" && "bg-emerald-50 text-emerald-700",
                  isCurrent && "bg-market-cream text-market-or-dark",
                  step.state === "upcoming" && "bg-slate-100 text-slate-500"
                )}
              >
                {step.state === "done" ? t("stateDone") : isCurrent ? t(`steps.${step.key}.time`) : t("stateUpcoming")}
              </p>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="overview-onboarding-benefits" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
        <h2 id="overview-onboarding-benefits" className="font-display text-base font-semibold text-market-navy">{t("benefitsTitle")}</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BENEFITS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-market-or-dark ring-1 ring-slate-200/70" aria-hidden>
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-market-navy">{t(`benefits.${key}.title`)}</span>
                <span className="block text-xs leading-relaxed text-slate-500">{t(`benefits.${key}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
