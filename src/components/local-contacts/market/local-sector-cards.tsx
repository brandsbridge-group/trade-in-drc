import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import { Pickaxe, Zap, Building2, Sprout, Truck, RadioTower, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export interface LocalSectorCardData {
  key: string;
  /** Real taxonomy id when a sector row matched, else null. */
  sectorId: string | null;
  companies: number;
}

interface SectorBlueprint {
  key: "mining" | "energy" | "construction" | "agriculture" | "logistics" | "digital";
  icon: LucideIcon;
  iconColor: string;
  /** Keyword matcher against a real sector's `name_en`. */
  match: RegExp;
}

/** Design order (customer design 3): Mining, Energy, Construction, Agriculture, Logistics, Digital. */
export const LOCAL_SECTOR_BLUEPRINTS: readonly SectorBlueprint[] = [
  { key: "mining", icon: Pickaxe, iconColor: "text-amber-500", match: /min/i },
  { key: "energy", icon: Zap, iconColor: "text-blue-600", match: /energ/i },
  { key: "construction", icon: Building2, iconColor: "text-amber-600", match: /construc/i },
  { key: "agriculture", icon: Sprout, iconColor: "text-emerald-600", match: /agri|agro/i },
  { key: "logistics", icon: Truck, iconColor: "text-blue-600", match: /logist|transport/i },
  { key: "digital", icon: RadioTower, iconColor: "text-purple-600", match: /digital|tech|telecom/i },
] as const;

/**
 * Six strategic-sector cards with live verified-company counts (customer design
 * 3). Each card: coloured line icon, sector name, "N Companies", and a navy
 * "Explore Sector" button that deep-links into the filtered directory.
 */
export async function LocalSectorCards({ sectors }: { sectors: LocalSectorCardData[] }) {
  const t = await getTranslations("LocalContacts.sectors");
  const byKey = new Map(sectors.map((s) => [s.key, s]));

  return (
    <section className="bg-transparent pb-12 md:pb-14">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="mb-5 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-market-navy" />
            {t("heading")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {LOCAL_SECTOR_BLUEPRINTS.map((bp) => {
            const data = byKey.get(bp.key);
            const href = data?.sectorId ? `/companies?sector=${data.sectorId}` : "/companies";
            const Icon = bp.icon;
            return (
              <article
                key={bp.key}
                className="group flex flex-col items-center gap-2 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-6 text-center shadow-[0_18px_45px_-36px_rgba(15,23,42,0.76)] transition-all duration-200 hover:-translate-y-1 hover:border-market-navy/30 hover:shadow-[0_26px_60px_-36px_rgba(15,23,42,0.7)]"
              >
                <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Icon className={`h-5 w-5 ${bp.iconColor}`} strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="font-display text-sm font-bold leading-snug text-market-navy">
                  {t(bp.key)}
                </h3>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-market-navy">{data?.companies ?? 0}</span>{" "}
                  {t("companies")}
                </p>
                <Link
                  href={href}
                  className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-market-navy px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-market-navy-deep"
                >
                  {t("explore")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-full border border-market-navy/30 bg-white px-4 py-2 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
          >
            {t("viewAllSectors")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/local-contacts/provinces"
            className="inline-flex items-center gap-1.5 rounded-full border border-market-navy/30 bg-white px-4 py-2 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
          >
            {t("viewByProvince")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
