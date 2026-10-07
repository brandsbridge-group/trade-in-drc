import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SECTOR_BLUEPRINTS } from "./sector-blueprint";

export interface SectorCardData {
  key: string;
  /** Real taxonomy id when a sector row matched, else null. */
  sectorId: string | null;
  companies: number;
  verifiedPartners: number;
}

/**
 * 3×2 grid of the six curated sector cards (customer design 9). Each card shows
 * a coloured line icon, the sector name + description, two live stats
 * (Companies / Verified Partners) and a navy "Explore Sector" button that deep
 * links into the filtered companies directory.
 */
export async function SectorCards({ sectors }: { sectors: SectorCardData[] }) {
  const t = await getTranslations("BySector");
  const byKey = new Map(sectors.map((s) => [s.key, s]));

  return (
    <section className="bg-white py-5 md:py-7">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-px border-y border-slate-200 bg-slate-200 px-4 md:grid-cols-2 md:border-x md:px-6 lg:grid-cols-3">
        {SECTOR_BLUEPRINTS.map((bp) => {
          const data = byKey.get(bp.key);
          const href = data?.sectorId ? `/companies?sector=${data.sectorId}` : "/companies";
          const Icon = bp.icon;
          return (
            <article
              key={bp.key}
              className="group flex flex-col bg-white p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${bp.iconBg}`}>
                  <Icon className={`h-5 w-5 ${bp.iconColor}`} aria-hidden />
                </span>
                <h3 className="pt-1 font-display text-base font-bold leading-snug text-market-navy sm:text-lg">
                  {t(`sectors.${bp.key}.name`)}
                </h3>
              </div>

              <p className="mt-4 min-h-12 text-sm leading-relaxed text-slate-600">
                {t(`sectors.${bp.key}.desc`)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-blue-700" aria-hidden />
                  <span className="text-xs text-slate-600">
                    <span className="font-semibold tabular-nums text-market-navy">{data?.companies ?? 0}</span>{" "}
                    {t("stats.companies")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
                  <span className="text-xs text-slate-600">
                    <span className="font-semibold tabular-nums text-market-navy">{data?.verifiedPartners ?? 0}</span>{" "}
                    {t("stats.verifiedPartners")}
                  </span>
                </div>
              </div>

              <Link
                href={href}
                className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-800 group-hover:text-blue-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                {t("exploreSector")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
