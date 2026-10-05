"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPTIONAL_STEPS, stepsForProfile, type RegistrationProfile } from "./constants";

interface Props {
  current: number;
  /** Which path's steps to render — 2 for Congolese, 3 for international. */
  profile: RegistrationProfile;
  /** Jump back to any already-completed step. The current step and every
   *  step still ahead (not validated yet) render as plain, non-interactive
   *  segments. */
  onStepClick?: (index: number) => void;
}

/**
 * Step segments in the dashboard's visual language (same as the verification
 * screen's phases): the current step is the navy segment, completed ones show
 * a green check and are clickable, upcoming ones are muted. A "Step X of Y"
 * counter sits above for screen readers and small screens alike.
 */
export function Stepper({ current, profile, onStepClick }: Props) {
  const t = useTranslations("RegisterCompany");
  const steps = stepsForProfile(profile);

  return (
    <nav aria-label={t("stepper.aria")} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
      <p className="sr-only">{t("stepper.counter", { current: current + 1, total: steps.length })}</p>
      <ol className={cn("grid grid-cols-1 gap-2", steps.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {steps.map((step, i) => {
          const active = i === current;
          const done = i < current;
          const clickable = done && Boolean(onStepClick);
          const content = (
            <>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  done && "bg-emerald-100 text-emerald-700",
                  active && "bg-market-or text-market-navy",
                  !done && !active && "bg-slate-100 text-slate-400"
                )}
                aria-hidden
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="min-w-0 text-left">
                <span className={cn("block truncate text-[13px] font-semibold", !active && (done ? "text-market-navy" : "text-slate-500"))}>
                  {t(`stepper.steps.${step}`)}
                </span>
                <span className={cn("block truncate text-[11.5px]", active ? "text-white/65" : "text-slate-400")}>
                  {OPTIONAL_STEPS.includes(step)
                    ? t("stepper.optional")
                    : t("stepper.counter", { current: i + 1, total: steps.length })}
                </span>
              </span>
            </>
          );
          const segment = cn(
            "flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5",
            active && "bg-market-navy text-white"
          );
          return (
            <li key={step} aria-current={active ? "step" : undefined} className="min-w-0">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(i)}
                  aria-label={t("stepper.jumpTo", { step: t(`stepper.steps.${step}`) })}
                  className={cn(segment, "transition-colors duration-150 hover:bg-slate-50")}
                >
                  {content}
                </button>
              ) : (
                <div className={segment}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
