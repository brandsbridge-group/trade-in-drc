"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardCheck, Mail, Clock, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const STEP_BADGE =
  "flex size-7 items-center justify-center rounded-md bg-market-navy text-sm font-bold text-white";

interface RequestConfirmationProps {
  submitted: boolean;
  reference: string | null;
  onReset: () => void;
}

/** Column 3 — placeholder before submit, receipt (with real Request ID) after. */
export function RequestConfirmation({
  submitted,
  reference,
  onReset,
}: RequestConfirmationProps) {
  const t = useTranslations("FindPartner");

  const infoRows = [
    { Icon: ClipboardCheck, text: t("step3.info1") },
    { Icon: Mail, text: t("step3.info2") },
    { Icon: Clock, text: t("step3.info3") },
  ];

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className={STEP_BADGE} aria-hidden>
          3
        </span>
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("step3.title")}
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-500">{t("step3.subtitle")}</p>

      {!submitted ? (
        <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6">
          <p className="max-w-[16rem] text-center text-sm text-slate-400">
            {t("step3.placeholder")}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-lg border border-emerald-200 bg-emerald-50/50 p-5",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
          )}
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {t("step3.thankYou")}
            </p>
          </div>

          <div className="mt-4 rounded-md border border-dashed border-emerald-300 bg-white px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t("step3.requestId")}
            </p>
            <p className="mt-1 font-mono text-base font-bold text-emerald-600">
              {reference ?? "—"}
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {infoRows.map(({ Icon, text }, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Icon className="mt-0.5 size-4 shrink-0 text-market-navy/70" aria-hidden />
                <span className="leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onReset}
            className="mt-5 w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-50"
          >
            {t("step3.another")}
          </button>

          <Link
            href="/companies"
            className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:text-market-navy-deep"
          >
            {t("step3.browse")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
