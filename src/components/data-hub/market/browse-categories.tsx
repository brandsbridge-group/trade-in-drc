import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  BarChart3,
  Users,
  MapPin,
  ArrowLeftRight,
  TrendingUp,
  Bell,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORIES: { key: string; href: string; icon: LucideIcon }[] = [
  { key: "sectorReports", href: "/data-hub/reports/market_report", icon: BarChart3 },
  { key: "companyData", href: "/companies", icon: Users },
  { key: "provincialProfiles", href: "/local-contacts/provinces", icon: MapPin },
  { key: "tradeFlows", href: "/data-hub", icon: ArrowLeftRight },
  { key: "investmentOpps", href: "/opportunities", icon: TrendingUp },
  { key: "marketSignals", href: "/data-hub", icon: Bell },
];

/** Browse by Data Category — six navigational tiles. */
export function BrowseCategories() {
  const t = useTranslations("MarketIntel.browse");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-market-navy">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="group flex items-start gap-3 rounded-md border border-slate-200 p-3 transition-colors duration-150 hover:border-market-navy hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-market-navy">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-market-navy">
                {t(`${key}.title`)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {t(`${key}.body`)}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-market-navy" />
          </Link>
        ))}
      </div>
    </section>
  );
}
