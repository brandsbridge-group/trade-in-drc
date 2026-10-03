import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

/** Blue services hero with a high-contrast message, gold action, and service montage. */
export async function ServicesHero() {
  const t = await getTranslations("Services.hero");

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(203,161,78,0.16),transparent_38%)]" />
      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-7 px-4 py-8 sm:py-10 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-12">
        <div className="relative z-10">
          <span className="mb-4 block h-1 w-12 bg-market-or" aria-hidden />
          <h1 className="max-w-xl font-display text-3xl font-bold leading-tight text-white md:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#request-service"
              className="inline-flex items-center gap-2 rounded-md bg-market-or px-5 py-3 text-sm font-bold text-market-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors duration-150 hover:bg-market-or-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-or"
            >
              {t("requestCta")} <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("exploreCta")}
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden border border-white/15 bg-white/5 p-1.5 shadow-[0_30px_70px_-36px_rgba(2,6,23,0.65)]">
          <Image
            src="/images/services/hero-montage.jpg"
            alt={t("title")}
            width={823}
            height={454}
            priority
            className="relative h-auto w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
