import { getTranslations } from "next-intl/server";
import { Users, Globe, Boxes, Briefcase, Clock, ShieldCheck } from "lucide-react";

export interface StripStat {
  key: string;
  value: string;
}

const STRIP_ICONS: Record<string, typeof Users> = {
  companies: Users,
  provinces: Globe,
  categories: Boxes,
  opportunities: Briefcase,
  access: Clock,
  secure: ShieldCheck,
};

/** Six-stat strip closing the marketplace page (customer design footer band). */
export async function MarketplaceStatsStrip({ stats }: { stats: StripStat[] }) {
  const t = await getTranslations("MarketplacePage.strip");
  return (
    <section className="bg-white pb-10">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="grid grid-cols-2 gap-y-5 rounded-xl border border-slate-200 bg-white px-4 py-5 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(({ key, value }, i) => {
            const Icon = STRIP_ICONS[key] ?? ShieldCheck;
            return (
              <div
                key={key}
                className={`flex items-center justify-center gap-3 ${
                  i > 0 ? "lg:border-l lg:border-slate-200" : ""
                }`}
              >
                <Icon className="h-7 w-7 flex-none text-primary" strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                  <div className="font-display text-base font-bold leading-tight text-primary">
                    {value}
                  </div>
                  <div className="text-[11px] leading-tight text-slate-500">
                    {t(key)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
