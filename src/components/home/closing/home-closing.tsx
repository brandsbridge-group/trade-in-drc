import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Link } from "@/i18n/routing";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "@/components/home/landing/blur-data";

const TRUST_KEYS = ["verified", "bilingual", "free"] as const;

/**
 * The homepage's closing hero: the page ends the way it opens. Full-bleed navy
 * scene with the DRC network map on the right, and — on the same container and
 * type scale as the gateway hero — the "transform" statement, the join CTA
 * (primary, same gold pill as the hero) with the market as the second way in,
 * and the trust points right under the buttons.
 */
export async function HomeClosing({ locale }: { locale: string }) {
  const [tTransform, tJoin, tHero] = await Promise.all([
    getTranslations({ locale, namespace: "Landing.transform" }),
    getTranslations({ locale, namespace: "Landing.join" }),
    getTranslations({ locale, namespace: "Landing.hero" }),
  ]);

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[var(--color-landing-navy-2)]">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(110deg,var(--color-landing-navy-2)_0%,var(--color-landing-navy-2)_45%,var(--color-landing-navy-mid)_100%)]" />
        {/* Square artwork sized by the band's height and faded at its edge, so the whole map shows without a visible frame. */}
        <div className="absolute right-[-30%] top-1/2 aspect-square h-[120%] -translate-y-1/2 opacity-30 [mask-image:radial-gradient(closest-side,black_60%,transparent)] sm:right-[-12%] md:right-[-6%] md:h-[116%] md:opacity-100 lg:right-[3%]">
          <Image
            src="/images/landing/drc-map.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 120vw"
            placeholder="blur"
            blurDataURL={BLUR.drcMap}
            className="object-contain"
          />
        </div>
        {/* left-dark scrim for headline legibility, as in the gateway hero */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,28,68,0.96)_0%,rgba(14,28,68,0.80)_40%,rgba(14,28,68,0.20)_72%,rgba(14,28,68,0)_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <MotionEnter>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-market-or-light">
              {tJoin("tagline")}
            </p>

            <h2 className="mt-4 text-balance text-[1.9rem] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.4rem] xl:text-[2.75rem]">
              {tTransform("lead")}
              <span className="bg-[linear-gradient(135deg,#E4C98A_0%,#CBA14E_55%,#B68B3A_100%)] bg-clip-text text-transparent">
                {tTransform("accent")}
              </span>
            </h2>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register-company"
                className="group inline-flex items-center gap-2 rounded-full bg-market-or px-6 py-3 text-sm font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark"
              >
                {tJoin("cta")}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/market"
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-colors duration-150 ease-out hover:bg-white/[0.12]"
              >
                {tHero("ctaMarket")}
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/70">
              {TRUST_KEYS.map((k) => (
                <li key={k} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-market-or" aria-hidden />
                  {tHero(`trust.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </MotionEnter>
      </div>
    </section>
  );
}
