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
    <section className="bg-white py-10 md:py-12">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-5 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        {SECTOR_BLUEPRINTS.map((bp) => {
          const data = byKey.get(bp.key);
          const href = data?.sectorId ? `/companies?sector=${data.sectorId}` : "/companies";
          const Icon = bp.icon;
          return (
            <article
              key={bp.key}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bp.iconBg}`}>
                  <Icon className={`h-6 w-6 ${bp.iconColor}`} aria-hidden />
                </span>
                <h3 className="pt-1 font-display text-lg font-bold leading-snug text-market-navy">
                  {t(`sectors.${bp.key}.name`)}
                </h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(`sectors.${bp.key}.desc`)}
              </p>

              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-market-navy" aria-hidden />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold text-market-navy">{data?.companies ?? 0}</span>{" "}
                    {t("stats.companies")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-market-navy" aria-hidden />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold text-market-navy">{data?.verifiedPartners ?? 0}</span>{" "}
                    {t("stats.verifiedPartners")}
                  </span>
                </div>
              </div>

              <Link
                href={href}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-market-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep"
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
