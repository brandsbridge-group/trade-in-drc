"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardCheck, Mail, Clock, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const STEP_BADGE =
  "flex size-8 items-center justify-center rounded-lg bg-market-navy text-sm font-bold text-white shadow-sm";

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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.55)] md:p-5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className={STEP_BADGE} aria-hidden>
          3
        </span>
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("step3.title")}
        </h2>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-slate-500">{t("step3.subtitle")}</p>

      {!submitted ? (
        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          <span className="mb-3 grid size-12 place-items-center rounded-xl bg-white text-market-navy shadow-sm ring-1 ring-slate-200">
            <ClipboardCheck className="size-5" aria-hidden />
          </span>
          <p className="max-w-[16rem] text-sm leading-relaxed text-slate-500">
            {t("step3.placeholder")}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-lg border border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] p-5",
            "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
          )}
        >
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {t("step3.thankYou")}
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-white px-4 py-3 text-center">
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
            className="mt-5 h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-50"
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
    </section>
  );
}
