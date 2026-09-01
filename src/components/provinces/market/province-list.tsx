import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { KEY_PROVINCES } from "./key-provinces";

interface ProvinceListProps {
  locale: string;
  /** province value (companies.province) → verified company count. */
  countByProvince: Map<string, number>;
}

/** Right column: 7 "Key Economic Provinces" row-cards with real counts. */
export async function ProvinceList({ locale, countByProvince }: ProvinceListProps) {
  const t = await getTranslations({ locale, namespace: "ByProvince" });
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <section
      aria-label={t("keyProvincesTitle")}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-2 font-display text-base font-bold text-market-navy">
        {t("keyProvincesTitle")}
      </h2>

      <div className="divide-y divide-slate-100">
        {KEY_PROVINCES.map((p) => (
          <div
            key={p.value}
            className="grid grid-cols-[56px_1fr_auto] items-center gap-3 py-2 transition-colors duration-150 lg:grid-cols-[56px_1fr_auto_auto]"
          >
            <div className="relative h-11 w-14 flex-none overflow-hidden rounded-sm bg-slate-100">
              <Image src={p.thumb} alt="" fill sizes="56px" className="object-cover" />
            </div>

            <div className="min-w-0">
              <div className="truncate font-bold leading-tight text-market-navy">
                {p.displayName}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3 flex-none" aria-hidden />
                {p.subLabel}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="mb-1 text-[0.68rem] font-semibold text-market-navy">
                {t("dominantSectors")}
              </div>
              <div className="flex items-center gap-1.5 text-market-navy">
                {p.icons.map((Icon, i) => (
                  <Icon key={i} className="h-4 w-4" aria-hidden />
                ))}
                <span className="tracking-widest text-slate-400" aria-hidden>
                  ···
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="whitespace-nowrap font-display text-sm font-bold text-market-navy">
                {fmt(countByProvince.get(p.value) ?? 0)}{" "}
                <span className="font-sans text-xs font-normal text-slate-500">
                  {t("companiesUnit")}
                </span>
              </div>
              <Link
                href={{ pathname: "/companies", query: { region: p.value } }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-market-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep"
              >
                {t("exploreProvince")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
