import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BLUR } from "./blur-data";

export async function LandingTransformBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.transform" });
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,var(--color-landing-navy-2),var(--color-landing-navy-mid))] px-6 py-10 md:px-12 md:py-12">
          <p className="relative z-10 max-w-2xl text-2xl font-bold leading-snug text-white md:text-3xl">
            {t("lead")}
            <span className="text-gold-gradient">{t("accent")}</span>
          </p>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block [mask-image:linear-gradient(to_right,transparent,black_60%)]"
            aria-hidden
          >
            <Image
              src="/images/landing/drc-map.webp"
              alt=""
              aria-hidden
              fill
              sizes="50vw"
              placeholder="blur"
              blurDataURL={BLUR.drcMap}
              className="object-cover opacity-70"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
