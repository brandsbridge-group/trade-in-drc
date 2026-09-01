import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "./blur-data";

/** Headline figures are widely-cited, conservative facts about the DRC economy. */
const FACTS = [
  { key: "cobalt", value: "70%+" },
  { key: "hydropower", value: "100 GW" },
  { key: "population", value: "100M+" },
  { key: "land", value: "80M ha" },
] as const;

export async function LandingWhyDrc({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.whyDrc" });
  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-[var(--color-landing-navy-2)] text-white">
      {/* Ambient backdrop: aerial Congo River at golden hour. Motion-safe video loop;
          reduced-motion users see the still poster. Navy overlay keeps the stats legible. */}
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

      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-landing-gold">
            {t("eyebrow")}
            <span className="h-px w-12 bg-landing-gold/60" />
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{t("subtitle")}</p>
        </div>

        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(({ key, value }) => (
            <MotionEnter key={key}>
              <div className="border-t border-white/20 pt-4">
                <p className="text-4xl font-extrabold tracking-tight text-gold-gradient">{value}</p>
                <p className="mt-1 text-sm font-semibold text-white">{t(`items.${key}.label`)}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/75">{t(`items.${key}.context`)}</p>
              </div>
            </MotionEnter>
          ))}
        </div>
      </div>
    </section>
  );
}
