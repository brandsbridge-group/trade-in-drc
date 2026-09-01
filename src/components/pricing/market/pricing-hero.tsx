import Image from "next/image";
import { CompareTable } from "./compare-table";
import { PremiumApplyButton } from "./premium-apply-form";
import type { Translator } from "./types";

const HERO_IMAGE = "/images/pricing/hero-mining.jpg";

const APPLY_BTN_CLS =
  "h-auto rounded-[0.5rem] bg-market-red px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-market-red/25 transition-colors duration-150 hover:bg-market-red-dark";

/**
 * Navy hero (design 12): full-bleed mining photo faded into navy on the left,
 * headline + price + apply CTA on the left, and the floating "Compare
 * Membership Plans" card on the right. Presentational RSC — the only client
 * island is the apply button.
 */
export function PricingHero({ t }: { t: Translator }) {
  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      {/* Full-bleed photo, faded into the navy so the left column stays legible. */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/90 to-market-navy/30" />
        <div className="absolute inset-0 bg-market-navy/20" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1500px] items-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-2 lg:gap-10 lg:py-16">
        {/* Left — pitch + price + CTA */}
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.6rem]">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            {t("hero.subtitle")}
          </p>

          <div className="mt-7">
            <p className="text-sm text-white/70">{t("hero.startingFrom")}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold text-market-gold sm:text-5xl">
                {t("hero.price")}
              </span>
              <span className="text-base font-medium text-white/70">
                {t("hero.per")}
              </span>
            </p>
          </div>

          <div className="mt-7">
            <PremiumApplyButton
              label={t("hero.applyCta")}
              className={APPLY_BTN_CLS}
            />
          </div>
        </div>

        {/* Right — floating compare card */}
        <div className="lg:pl-6">
          <CompareTable t={t} />
        </div>
      </div>
    </section>
  );
}
