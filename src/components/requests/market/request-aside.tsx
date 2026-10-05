import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";

/** Beside the form: what happens after sending, and where to follow a request already sent. */
export async function RequestAside() {
  const t = await getTranslations("FindPartner.aside");
  const steps = ["how1", "how2", "how3"] as const;

  return (
    <aside className="min-w-0 space-y-3 lg:sticky lg:top-24">
      <section aria-labelledby="request-how" className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
        <h2 id="request-how" className="font-display text-base font-semibold text-market-navy">{t("howTitle")}</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-market-cream text-xs font-bold text-market-or-dark" aria-hidden>
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-market-navy">{t(`${step}Title`)}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{t(`${step}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="request-track" className="rounded-2xl bg-market-navy p-5 text-white">
        <h2 id="request-track" className="font-display text-base font-semibold">{t("trackTitle")}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{t("trackBody")}</p>
        <Link
          href="/request/track"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-market-or px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-market-or-light"
        >
          {t("trackCta")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}
