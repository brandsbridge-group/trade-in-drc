import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { DIRECTION_IMAGES, type Origin } from "@/lib/marketplace/offers";

const DIRECTIONS = [
  { key: "import", Icon: ArrowDownRight, image: DIRECTION_IMAGES.import },
  { key: "export", Icon: ArrowUpRight, image: DIRECTION_IMAGES.export },
] as const;

/**
 * The two directions of trade: Import into the DRC / Export from the DRC.
 * Full-bleed photo cards — a glass pill (direction + live offer count) on top,
 * title and copy on a bottom gradient, a round arrow button that turns gold
 * on hover. Hover: photo settles in (§2.6, 300 ms), arrow nudges (§2.1).
 */
export async function MarketDirections({ offerCounts }: { offerCounts: Record<Origin, number> }) {
  const t = await getTranslations("MarketLanding.directions");

  return (
    <section id="directions" className="scroll-mt-16 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-landing-navy)] md:text-[22px]">
          {t("heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{t("lead")}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {DIRECTIONS.map(({ key, Icon, image }) => (
            <Link
              key={key}
              href={`/products?origin=${key}`}
              className="group relative isolate flex min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl bg-market-navy p-5 shadow-sm ring-1 ring-black/5 transition-shadow duration-150 ease-out hover:shadow-2xl hover:shadow-slate-900/20 md:min-h-[300px] md:p-6"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="-z-10 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
              {/* Legibility: dark from the bottom-left, the photo stays clear top-right. */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-market-navy/95 via-market-navy/35 to-transparent" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-market-navy/50 via-transparent to-transparent" />

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {t(`${key}.badge`)}
                </span>
                <span className="rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md">
                  {t("offers", { count: offerCounts[key] })}
                </span>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="max-w-md">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white md:text-[28px]">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{t(`${key}.body`)}</p>
                </div>
                <span
                  aria-hidden
                  className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white text-market-navy shadow-lg transition-colors duration-150 ease-out group-hover:bg-market-or"
                >
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
