import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, Users, List } from "lucide-react";
import { Link } from "@/i18n/routing";

const FILL_NA = "#DDE6F0";
const FILL_OTHER = "#A9C4E4";
const FILL_FEATURED = "#1E5AA8";

interface MapPanelProps {
  locale: string;
  totalCompanies: number;
  verifiedCompanies: number;
}

/** Left column: DRC choropleth map (design artwork), legend, stat tiles, view-all. */
export async function MapPanel({ locale, totalCompanies, verifiedCompanies }: MapPanelProps) {
  const t = await getTranslations({ locale, namespace: "ByProvince" });
  const fmt = (n: number) => n.toLocaleString("en-US");

  const legend: { color: string; label: string }[] = [
    { color: FILL_FEATURED, label: t("legendFeatured") },
    { color: FILL_OTHER, label: t("legendOther") },
    { color: FILL_NA, label: t("legendNotAvailable") },
  ];

  const stats: { icon: typeof Building2; num: number; label: string }[] = [
    { icon: Building2, num: totalCompanies, label: t("companiesListedLabel") },
    { icon: Users, num: verifiedCompanies, label: t("verifiedContactsLabel") },
  ];

  return (
    <section
      aria-label={t("browseTitle")}
      className="flex h-full flex-col justify-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <div>
          <h2 className="font-display text-base font-bold text-market-navy">{t("browseTitle")}</h2>
          <p className="mt-1 max-w-[180px] text-xs text-slate-500">{t("browseHint")}</p>

          <ul className="my-3 grid gap-1.5 text-[0.72rem] text-slate-500">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-2">
                <span className="h-3 w-3 flex-none rounded-sm" style={{ background: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>

          <div className="mb-3 grid gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-sm bg-blue-50 text-market-navy">
                  <s.icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <div className="font-display text-sm font-bold leading-tight text-market-navy">
                    {fmt(s.num)}
                  </div>
                  <div className="text-[0.68rem] leading-tight text-slate-500">
                    {s.label} {t("acrossAllProvinces")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/companies"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-market-navy transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50"
          >
            <List className="h-4 w-4" aria-hidden />
            {t("viewAllProvinces")}
          </Link>
        </div>

        {/* Real DRC choropleth (provinces + pins + labels) from the design art. */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <Image
            src="/images/provinces/drc-map.png"
            alt={t("browseTitle")}
            width={902}
            height={794}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
