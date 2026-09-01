import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "./blur-data";

export async function LandingAboutIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.about" });
  return (
    <section className="flex min-h-screen flex-col justify-center bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <MotionEnter>
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-landing-gold">
              {t("eyebrow")}
              <span className="h-px w-12 bg-landing-gold/60" />
            </p>
            <h2 className="text-3xl font-extrabold leading-[1.05] tracking-tight text-[var(--color-landing-ink)] sm:text-4xl md:text-5xl">
              {t("titleLead")}
              <br />
              <span className="text-gold-gradient">{t("titleAccent")}</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-600">
              {t("body")}
            </p>
          </div>
        </MotionEnter>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--color-landing-navy)] ring-1 ring-slate-900/10">
          <Image
            src="/images/landing/about-composite.webp"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            placeholder="blur"
            blurDataURL={BLUR.aboutComposite}
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
