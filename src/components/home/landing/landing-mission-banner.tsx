import { getTranslations } from "next-intl/server";
import { Target, Globe2, TrendingUp } from "lucide-react";

export async function LandingMissionBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.mission" });

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-4 sm:pt-16">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(135deg,#0e1d36_0%,#163866_45%,#0b1830_100%)] px-6 py-8 shadow-[0_34px_80px_-36px_rgba(9,15,28,0.8)] md:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,196,77,0.18),transparent_30%)]" aria-hidden />

          <div className="relative flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-landing-gold/90 bg-white/5 text-landing-gold shadow-[0_0_0_8px_rgba(255,255,255,0.04)]">
              <Target className="h-6 w-6" />
            </div>

            <div className="max-w-3xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-landing-gold/90">
                {t("label")}
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug text-white md:text-[1.35rem]">
                {t("text")}
              </p>
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-200/80">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Verified</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Connected</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Growth</span>
          </div>

          <Globe2
            className="pointer-events-none absolute -right-3 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-landing-gold/12 md:block"
            aria-hidden
          />
          <TrendingUp
            className="pointer-events-none absolute right-24 top-7 hidden h-12 w-12 text-landing-gold/12 lg:block"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
