import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

/** Light hero (design Our Services): blue heading + copy + CTAs, montage right. */
export async function ServicesHero() {
  const t = await getTranslations("Services.hero");

  return (
    <section className="bg-transparent">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-4 py-8 md:grid-cols-[1fr_1.05fr] md:px-6">
        <div className="relative">
          
          <h1 className="font-display text-3xl font-bold tracking-tight text-market-navy md:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#request-service"
              className="inline-flex items-center gap-2 rounded-full bg-market-navy px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-market-navy-deep"
            >
              {t("requestCta")} <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full border border-market-navy/25 bg-white/80 px-5 py-3 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
            >
              {t("exploreCta")}
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.5)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(227,184,85,0.2),transparent_32%)]" aria-hidden />
          <Image
            src="/images/services/hero-montage.jpg"
            alt={t("title")}
            width={823}
            height={454}
            priority
            className="relative h-auto w-full rounded-[20px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
