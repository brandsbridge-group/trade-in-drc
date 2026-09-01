"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { stepsForProfile, type RegistrationProfile } from "./constants";

interface Props {
  current: number;
  /** Which path's steps to render — 6 for Congolese, 7 for international. */
  profile: RegistrationProfile;
  /** P2-7: jump back to any already-completed step. Omitted step circles
   *  render as plain (non-interactive) text — used for the current step and
   *  every step still ahead, which the applicant hasn't validated yet. */
  onStepClick?: (index: number) => void;
}

/**
 * Numbered step circles with chevron separators, plus a "Step X of Y"
 * counter (P2-7 — the counter was previously implicit, readable only by
 * counting circles). The current step's circle is solid navy; completed
 * steps are also solid navy and clickable; upcoming steps are outlined gray.
 */
export function Stepper({ current, profile, onStepClick }: Props) {
  const t = useTranslations("RegisterCompany");
  const steps = stepsForProfile(profile);

  return (
    <nav
      aria-label={t("stepper.aria")}
      className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("stepper.counter", { current: current + 1, total: steps.length })}
      </p>
      <ol className="flex flex-wrap items-center gap-y-3">
        {steps.map((step, i) => {
          const active = i === current;
          const done = i < current;
          const clickable = done && Boolean(onStepClick);
          const circle = (
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors duration-150",
                active || done
                  ? "bg-market-navy text-white"
                  : "border border-slate-300 text-slate-400"
              )}
            >
              {i + 1}
            </span>
          );
          const label = (
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-market-navy" : "text-slate-500"
              )}
            >
              {t(`stepper.steps.${step}`)}
            </span>
          );
          return (
            <li key={step} className="flex items-center">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(i)}
                  aria-label={t("stepper.jumpTo", { step: t(`stepper.steps.${step}`) })}
                  className="flex items-center gap-2 rounded-[0.5rem] transition-colors duration-150 hover:opacity-80"
                >
                  {circle}
                  {label}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {circle}
                  {label}
                </div>
              )}
              {i < steps.length - 1 && (
                <ChevronRight
                  className="mx-3 size-4 text-slate-300"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
