import { getTranslations } from "next-intl/server";
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  Pickaxe,
  HardHat,
  Zap,
  Wheat,
  Truck,
  Factory,
  BadgeCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { FEATURED_PROVINCE } from "./key-provinces";

const STRATEGIC_SECTORS_COUNT = 12;

export interface RecommendedCompany {
  id: string;
  name: string;
  sectorLabel: string;
  verified: boolean;
}

interface FeaturedBandProps {
  locale: string;
  lualabaCount: number;
  recommended: RecommendedCompany[];
}

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Cream "Featured Province" monetization band for Lualaba (design 8). */
export async function FeaturedBand({ locale, lualabaCount, recommended }: FeaturedBandProps) {
  const t = await getTranslations({ locale, namespace: "ByProvince" });
  const fmt = (n: number) => n.toLocaleString("en-US");

  const stats: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Building2, value: fmt(lualabaCount), label: t("statCompanies") },
    { icon: Users, value: fmt(lualabaCount), label: t("statVerifiedContacts") },
    { icon: Target, value: String(STRATEGIC_SECTORS_COUNT), label: t("statStrategicSectors") },
    { icon: TrendingUp, value: t("investmentHigh"), label: t("statInvestmentPotential") },
  ];

  const sectors: { icon: LucideIcon; label: string; color: string }[] = [
    { icon: Pickaxe, label: t("sectorMining"), color: "text-market-gold" },
    { icon: HardHat, label: t("sectorConstruction"), color: "text-market-gold" },
    { icon: Zap, label: t("sectorEnergy"), color: "text-blue-600" },
    { icon: Wheat, label: t("sectorAgriculture"), color: "text-green-600" },
    { icon: Truck, label: t("sectorLogistics"), color: "text-market-navy" },
    { icon: Factory, label: t("sectorManufacturing"), color: "text-market-navy" },
  ];

  return (
    <section
      aria-label={t("featuredTitle")}
      className="mt-4 grid grid-cols-1 items-start gap-6 rounded-lg border border-amber-200/70 bg-market-cream p-5 lg:grid-cols-[1.3fr_1fr_1fr_0.9fr]"
    >
      {/* Col 1 — headline + borderless inline stats */}
      <div>
        <span className="mb-2.5 inline-block rounded-sm bg-market-gold px-2.5 py-1 text-[0.66rem] font-bold tracking-wider text-market-navy">
          {t("featuredBadge")}
        </span>
        <h2 className="font-display text-xl font-bold leading-tight text-market-navy">
          {t("featuredTitle")}
        </h2>
        <p className="my-2.5 text-sm leading-relaxed text-slate-500">{t("featuredDescription")}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className="h-5 w-5 flex-none text-market-navy" strokeWidth={1.75} aria-hidden />
              <div>
                <div className="font-display text-base font-bold leading-none text-market-navy">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[0.66rem] leading-tight text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Col 2 — key sectors (plain colored icons, no boxes) */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-market-navy">{t("keySectorsTitle")}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          {sectors.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 text-[0.8rem] font-medium leading-tight text-market-navy">
              <s.icon className={`h-5 w-5 flex-none ${s.color}`} strokeWidth={1.75} aria-hidden />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Col 3 — recommended companies */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-market-navy">{t("recommendedTitle")}</h3>
          <Link
            href={{ pathname: "/companies", query: { region: FEATURED_PROVINCE } }}
            className="text-xs font-semibold text-market-navy underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid gap-2">
          {recommended.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 transition-colors duration-150 hover:border-slate-300"
            >
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-slate-200 bg-slate-100 text-[0.7rem] font-bold text-market-navy">
                {monogram(c.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-800">{c.name}</div>
                <div className="truncate text-[0.66rem] text-slate-500">{c.sectorLabel}</div>
              </div>
              {c.verified && (
                <span className="ml-auto flex flex-none items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[0.66rem] font-bold text-green-700">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  {t("verified")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Col 4 — lead-gen CTA card */}
      <div className="flex flex-col gap-2.5 self-stretch rounded-lg border border-slate-200 bg-white p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-market-navy">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="font-display text-base font-bold leading-snug text-market-navy">
          {t("needTitle")}
        </h3>
        <p className="flex-1 text-xs text-slate-500">{t("needDescription")}</p>
        <Link
          href="/request"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-market-gold px-4 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:brightness-95"
        >
          {t("requestCta")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
