import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";
import { BLUR } from "@/components/home/landing/blur-data";

/** The six key sectors (Landing.sectors copy + /images/sectors artwork). */
const SECTORS = ["mining", "agriculture", "energy", "infrastructure", "forestry", "manufacturing"] as const;

/**
 * Homepage section 8 — key sectors: a white band of six informative cards
 * (photo, name, gold rule, short description). Read-only by design: no links,
 * no counts. Hover is a quiet 1.03 photo settle (§2.6).
 */
export async function HomeSectors({ locale }: { locale: string }) {
  const [tSectors, t] = await Promise.all([
    getTranslations({ locale, namespace: "Landing.sectors" }),
    getTranslations({ locale, namespace: "HomeWhy" }),
  ]);

  return (
    <HomeSection id="sectors" className="bg-white">
      <MotionEnter>
        <HomeSectionHeader eyebrow={t("sectorsLabel")} title={tSectors("title")} lead={tSectors("subtitle")} />
      </MotionEnter>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTORS.map((key) => (
          <li key={key}>
            <MotionEnter className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <Image
                    src={`/images/sectors/${key}.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw"
                    placeholder="blur"
                    blurDataURL={BLUR[key]}
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" aria-hidden />
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-[15px] font-bold text-[var(--color-landing-navy)]">
                    {tSectors(`items.${key}.title`)}
                  </h3>
                  <span className="mt-2 block h-0.5 w-7 rounded-full bg-market-or" aria-hidden />
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">{tSectors(`items.${key}.desc`)}</p>
                </div>
              </article>
            </MotionEnter>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
