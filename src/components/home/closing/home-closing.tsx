import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Globe2, Users } from "lucide-react";

import { Link } from "@/i18n/routing";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "@/components/home/landing/blur-data";

/**
 * The homepage's closing pair (same copy as the About page's banners):
 * a full-width navy "transform" statement over the DRC network map, then a
 * boxed split band — gold "Join the platform" link + navy tagline.
 */
export async function HomeClosing({ locale }: { locale: string }) {
  const [tTransform, tJoin] = await Promise.all([
    getTranslations({ locale, namespace: "Landing.transform" }),
    getTranslations({ locale, namespace: "Landing.join" }),
  ]);

  return (
    <>
      {/* Full-width statement band. */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(110deg,var(--color-landing-navy-2),var(--color-landing-navy-mid))]">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 md:block [mask-image:linear-gradient(to_right,transparent,black_55%)]"
          aria-hidden
        >
          <Image
            src="/images/landing/drc-map.webp"
            alt=""
            fill
            sizes="50vw"
            placeholder="blur"
            blurDataURL={BLUR.drcMap}
            className="object-cover opacity-70"
          />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <MotionEnter>
            <p className="max-w-xl text-xl font-bold leading-snug text-white sm:text-2xl">
              {tTransform("lead")}
              <span className="bg-[linear-gradient(135deg,#E4C98A_0%,#CBA14E_55%,#B68B3A_100%)] bg-clip-text text-transparent">
                {tTransform("accent")}
              </span>
            </p>
          </MotionEnter>
        </div>
      </section>

      {/* Boxed split band: join + tagline. */}
      <section className="py-16 sm:py-10">

      </section>
    </>
  );
}
