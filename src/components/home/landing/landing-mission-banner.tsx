import { getTranslations } from "next-intl/server";
import { Target, Globe2, TrendingUp } from "lucide-react";

export async function LandingMissionBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.mission" });
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-4 sm:pt-16">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,var(--color-landing-navy-2),var(--color-landing-navy-mid))] px-6 py-8 md:px-10">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-landing-gold text-landing-gold">
              <Target className="h-6 w-6" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-landing-gold">
                {t("label")}
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-snug text-white md:text-xl">
                {t("text")}
              </p>
            </div>
          </div>
          {/* decorative gold motifs */}
          <Globe2
            className="pointer-events-none absolute -right-2 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-landing-gold/15 md:block"
            aria-hidden
          />
          <TrendingUp
            className="pointer-events-none absolute right-24 top-6 hidden h-12 w-12 text-landing-gold/15 lg:block"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
