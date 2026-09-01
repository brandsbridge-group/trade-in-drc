import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "./blur-data";

/**
 * Cinematic full-bleed hero for the /about page. Same backdrop pattern as the
 * homepage hero: animated composite video over a still poster, navy gradient
 * overlay (darker left) so the white-on-dark copy stays crisp.
 *
 * Distinct from `landing-about-intro` (which keeps the side-by-side composition
 * for the homepage continuation) so each surface has its own identity.
 */
export async function AboutHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.about" });
  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-[var(--color-landing-navy-2)] text-white">
      {/* Ambient backdrop: navy Africa + glowing DRC + diagonal-split daytime Kinshasa */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/landing/about-hero-bg.webp"
          className="hidden h-full w-full object-cover motion-safe:block"
        >
          <source src="/videos/landing/about-hero-loop.webm" type="video/webm" />
          <source src="/videos/landing/about-hero-loop.mp4" type="video/mp4" />
        </video>
        <Image
          src="/images/landing/about-hero-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR.aboutHeroBg}
          className="object-cover motion-safe:hidden"
        />
        {/* Left-dark scrim for the headline + body copy */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,28,68,0.94)_0%,rgba(14,28,68,0.80)_40%,rgba(14,28,68,0.50)_70%,rgba(14,28,68,0.30)_100%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-20 lg:py-28">
        <MotionEnter>
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-landing-gold">
              {t("eyebrow")}
              <span className="h-px w-12 bg-landing-gold/60" />
            </p>
            <h1 className="text-4xl font-extrabold uppercase leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl">
              {t("titleLead")}
              <br />
              <span className="text-gold-gradient">{t("titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              {t("body")}
            </p>
          </div>
        </MotionEnter>
      </div>
    </section>
  );
}
