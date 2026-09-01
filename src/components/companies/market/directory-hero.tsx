import Image from "next/image";
import { getTranslations } from "next-intl/server";

const HERO_IMAGE = "/images/directory/skyline.jpg";

/**
 * Full-bleed skyline hero for the Verified Companies Directory (customer design
 * 7). Navy gradient overlay over the Kinshasa skyline photo, left-aligned white
 * heading + two-line trust subtitle. Kept short vertically so the badge
 * explainer card can overlap its bottom edge.
 */
export async function DirectoryHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "VerifiedDirectory" });

  return (
    <section className="relative isolate overflow-hidden bg-market-navy">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/85 to-market-navy/40"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-12 md:px-6 md:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-white/90">
          {t("heroSubtitle1")}
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/70">
          {t("heroSubtitle2")}
        </p>
      </div>
    </section>
  );
}
