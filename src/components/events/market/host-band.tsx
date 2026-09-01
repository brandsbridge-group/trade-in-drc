import { getTranslations } from "next-intl/server";
import { Megaphone, CalendarPlus } from "lucide-react";

/**
 * "Host or Promote Your Event" band (design 13): full-width navy call-to-action
 * whose button anchors to the rail submit form (#submit-event).
 */
export async function HostBand() {
  const t = await getTranslations("EventsHub.host");

  return (
    <section className="rounded-lg bg-market-navy text-white">
      <div className="flex flex-col items-start gap-5 px-5 py-7 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-start gap-4">
          <Megaphone className="mt-1 hidden h-9 w-9 shrink-0 text-market-gold sm:block" strokeWidth={1.6} aria-hidden />
          <div>
            <h2 className="font-display text-xl font-bold md:text-2xl">{t("heading")}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-white/80">{t("body")}</p>
          </div>
        </div>
        <a
          href="#submit-event"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-market-red px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t("cta")}
        </a>
      </div>
    </section>
  );
}
