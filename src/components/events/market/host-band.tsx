import { getTranslations } from "next-intl/server";
import { Megaphone, CalendarPlus } from "lucide-react";

/**
 * "Host or Promote Your Event" band (design 13): full-width navy call-to-action
 * whose button anchors to the rail submit form (#submit-event).
 */
export async function HostBand() {
  const t = await getTranslations("EventsHub.host");

  return (
    <section className="relative isolate overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#0d1d38_0%,#173c6b_100%)] text-white shadow-[0_24px_55px_-38px_rgba(15,23,42,0.75)]">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-14 h-44 w-44 rounded-full border border-market-or/20" />
      <div className="relative flex flex-col items-start gap-5 px-5 py-7 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-market-or sm:grid">
            <Megaphone className="h-6 w-6" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold leading-tight md:text-2xl">{t("heading")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{t("body")}</p>
          </div>
        </div>
        <a
          href="#submit-event"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-market-or px-6 text-sm font-bold text-market-navy shadow-sm transition-colors duration-150 hover:bg-market-or-light"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t("cta")}
        </a>
      </div>
    </section>
  );
}
