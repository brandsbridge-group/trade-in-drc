import { getTranslations } from "next-intl/server";
import { Handshake, ArrowRight, Globe2 } from "lucide-react";
import { Link } from "@/i18n/routing";

/**
 * Navy CTA band (customer design 3): inset rounded navy rectangle with a
 * marketing headline, subtitle, a gold "Request a Local Partner" button, and a
 * faint globe motif standing in for the design's Africa-map watermark.
 */
export async function CtaBand() {
  const t = await getTranslations("LocalContacts.band");

  return (
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-xl bg-market-navy px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10 md:py-9">
          <Globe2
            className="pointer-events-none absolute -right-6 top-1/2 hidden h-48 w-48 -translate-y-1/2 text-market-gold/10 md:block"
            strokeWidth={1}
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-xl font-bold leading-snug md:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{t("subtitle")}</p>
          </div>
          <Link
            href="/request"
            className="relative inline-flex shrink-0 items-center gap-2 rounded-md bg-market-gold px-6 py-3 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-gold/90"
          >
            <Handshake className="h-4 w-4" aria-hidden />
            {t("cta")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
