import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Handshake, ShieldCheck, Pickaxe, HardHat, Settings, Truck, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";

export interface FeaturedMiniCard {
  label: string;
  companies: number;
}

/** Icon per mini-card slot, in the design's fixed order. */
const MINI_ICONS: readonly LucideIcon[] = [Pickaxe, HardHat, Settings, Truck, FlaskConical];

/**
 * Featured Sector spotlight for Mining & Minerals (customer design 9): mining
 * photo with a "Featured Sector" pill on the left, editorial copy + five
 * sub-category count tiles on the right, and a gold CTA into the request flow.
 */
export async function FeaturedBand({ miniCards }: { miniCards: FeaturedMiniCard[] }) {
  const t = await getTranslations("BySector.featured");
  const tStats = await getTranslations("BySector.stats");

  return (
    <section className="bg-white pb-14">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 shadow-sm lg:grid-cols-[minmax(280px,34%)_1fr]">
          {/* Left: photo + pill */}
          <div className="relative min-h-[240px]">
            <Image
              src="/images/directory/mining.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-md bg-market-navy/90 px-3 py-1.5 text-xs font-semibold text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-market-gold" aria-hidden />
              {t("eyebrow")}
            </span>
          </div>

          {/* Right: copy + tiles + CTA */}
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-market-gold">{t("eyebrow")}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-market-navy">{t("name")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{t("desc")}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {miniCards.map((card, i) => {
                const Icon = MINI_ICONS[i] ?? Pickaxe;
                return (
                  <div
                    key={`${card.label}-${i}`}
                    className="flex flex-col items-center rounded-md border border-slate-200 bg-white px-3 py-4 text-center"
                  >
                    <Icon className="h-6 w-6 text-blue-600" aria-hidden />
                    <p className="mt-2 text-xs font-semibold leading-tight text-market-navy">{card.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {card.companies} {tStats("companies")}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/request"
                className="inline-flex items-center gap-2 rounded-md bg-market-gold px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:brightness-95"
              >
                <Handshake className="h-4 w-4" aria-hidden />
                {t("cta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
