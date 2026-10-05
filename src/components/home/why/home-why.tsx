import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "@/components/home/landing/blur-data";

/** Headline figures are widely cited, conservative facts about the DRC economy. */
const FACTS = [
  { key: "cobalt", value: "70%+" },
  { key: "hydropower", value: "100 GW" },
  { key: "population", value: "100M+" },
  { key: "land", value: "80M ha" },
] as const;

/**
 * Homepage section 7 — why the DRC. The one boxed-layout exception besides the
 * hero: a full-width band with the Congo River video loop behind it (still
 * poster under reduced motion); the content stays on the boxed container.
 */
export async function HomeWhy({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.whyDrc" });

  return (
    <section id="why-drc" className="relative isolate overflow-hidden bg-[var(--color-landing-navy-2)] text-white">
      {/* Aerial Congo River at golden hour, under a navy scrim for legibility. */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/landing/why-drc-bg.webp"
          className="hidden h-full w-full object-cover motion-safe:block"
        >
          <source src="/videos/landing/why-drc-loop.webm" type="video/webm" />
          <source src="/videos/landing/why-drc-loop.mp4" type="video/mp4" />
        </video>
        <Image
          src="/images/landing/why-drc-bg.webp"
          alt=""
          fill
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR.whyDrcBg}
          className="object-cover motion-safe:hidden"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(14,28,68,0.92)_0%,rgba(14,28,68,0.78)_45%,rgba(14,28,68,0.62)_75%,rgba(14,28,68,0.78)_100%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <MotionEnter>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-market-or">{t("eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">{t("title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{t("subtitle")}</p>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-4">
            {FACTS.map(({ key, value }) => (
              <li key={key} className="border-t border-white/20 pt-3">
                <p className="bg-[linear-gradient(135deg,#E4C98A_0%,#CBA14E_55%,#B68B3A_100%)] bg-clip-text font-display text-[1.75rem] font-bold leading-tight tracking-tight text-transparent sm:text-[2rem]">
                  {value}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold">{t(`items.${key}.label`)}</p>
                <p className="mt-1.5 hidden text-xs leading-relaxed text-white/65 sm:block">{t(`items.${key}.context`)}</p>
              </li>
            ))}
          </ul>
        </MotionEnter>
      </div>
    </section>
  );
}
