import { getTranslations } from "next-intl/server";
import {
  FileText,
  Phone,
  ClipboardCheck,
  MapPin,
  BadgeCheck,
} from "lucide-react";

/**
 * "Our Verification Approach" 5-step horizontal stepper (customer design 7).
 * Circular outlined icons joined by dashed connectors, each with a numbered
 * title and one-line caption. Stacks vertically on small screens.
 */
export async function VerificationApproach({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "VerifiedDirectory" });

  const steps = [
    { icon: FileText, title: t("step1Title"), caption: t("step1Caption") },
    { icon: Phone, title: t("step2Title"), caption: t("step2Caption") },
    { icon: ClipboardCheck, title: t("step3Title"), caption: t("step3Caption") },
    { icon: MapPin, title: t("step4Title"), caption: t("step4Caption") },
    { icon: BadgeCheck, title: t("step5Title"), caption: t("step5Caption") },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-center font-display text-lg font-bold tracking-tight text-market-navy">
        {t("approachTitle")}
      </h2>
      <ol className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:gap-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={i}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {i > 0 && (
                <span
                  className="absolute right-1/2 top-7 hidden h-px w-full border-t border-dashed border-slate-300 md:block"
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-market-navy/30 bg-white text-market-navy">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-3 px-2 text-sm font-semibold text-market-navy">
                {i + 1}. {step.title}
              </h3>
              <p className="mt-1 px-3 text-xs leading-relaxed text-slate-500">
                {step.caption}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
