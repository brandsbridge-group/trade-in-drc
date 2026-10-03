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
    <section className="bg-white pb-10 md:pb-14">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="grid grid-cols-1 overflow-hidden border border-slate-200 lg:grid-cols-[minmax(280px,34%)_1fr]">
          {/* Left: photo + pill */}
          <div className="relative min-h-[220px] lg:min-h-full">
            <Image
              src="/images/directory/mining.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 bg-market-navy px-3 py-1.5 text-xs font-semibold text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-market-gold" aria-hidden />
              {t("eyebrow")}
            </span>
          </div>

          {/* Right: copy + tiles + CTA */}
          <div className="p-5 sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">{t("eyebrow")}</p>
            <h2 className="mt-1 font-display text-xl font-bold text-market-navy md:text-2xl">{t("name")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{t("desc")}</p>

            <div className="mt-5 grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
              {miniCards.map((card, i) => {
                const Icon = MINI_ICONS[i] ?? Pickaxe;
                return (
                  <div
                    key={`${card.label}-${i}`}
                    className="flex min-w-0 flex-col items-center bg-white px-2 py-3 text-center sm:px-3"
                  >
                    <Icon className="h-5 w-5 text-blue-700" aria-hidden />
                    <p className="mt-2 text-xs font-semibold leading-tight text-market-navy">{card.label}</p>
                    <p className="mt-1 text-[11px] tabular-nums text-slate-500">
                      {card.companies} {tStats("companies")}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <Link
                href="/request"
                className="inline-flex items-center gap-2 bg-market-or px-4 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-or-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-or-dark"
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
