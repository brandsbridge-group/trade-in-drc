"use client";

import { Link } from "@/i18n/routing";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Step {
  key: string;
  href: string;
  done: boolean;
}

interface OnboardingCardProps {
  steps: Step[];
}

export function OnboardingCard({ steps }: OnboardingCardProps) {
  const t = useTranslations("Dashboard.onboarding");
  const reduce = useReducedMotion();
  const allDone = steps.every((s) => s.done);

  if (allDone) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
      <p className="text-base font-semibold mb-1">{t("title")}</p>
      <p className="text-xs text-muted-foreground mb-4">{t("subtitle")}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.key}>
            <Link
              href={s.href}
              className={`flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 ${
                s.done ? "" : "border border-slate-200"
              }`}
            >
              <AnimatePresence mode="wait">
                {s.done ? (
                  <motion.span
                    key="done"
                    initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                  >
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                  </motion.span>
                ) : (
                  <motion.span key="pending">
                    <Circle className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {i + 1}. {t(`steps.${s.key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(`steps.${s.key}.body`)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
