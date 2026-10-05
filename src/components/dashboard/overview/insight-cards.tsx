"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, BadgeCheck, FileText, Package } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { SearchEntry, TopProduct } from "@/lib/dashboard/overview/metrics";
import type { MarketWatch, SupplierMatch } from "@/lib/dashboard/overview/queries";
import { EmptyHint, OverviewCard } from "./overview-card";

function localized(locale: string, en: string | null, fr: string | null, fallback = "") {
  return (locale === "fr" ? fr ?? en : en ?? fr) ?? fallback;
}

/** Magnitude bars share one scale (the top product), one hue, 4px rounded ends. */
export function TopProductsCard({ products }: { products: TopProduct[] }) {
  const t = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();
  const max = Math.max(...products.map((p) => p.views), 1);

  return (
    <OverviewCard
      id="overview-top-products"
      title={t("topProducts.title")}
      aside={<Link href="/dashboard/products" className="text-xs font-semibold text-primary hover:underline">{t("topProducts.all")}</Link>}
    >
      {products.length === 0 ? (
        <EmptyHint text={t("topProducts.empty")} cta={{ href: "/dashboard/products", label: t("topProducts.emptyCta") }} />
      ) : (
        <ul className="space-y-2">
          {products.slice(0, 3).map((p) => {
            const name = localized(locale, p.name_en, p.name_fr, p.name);
            return (
              <li key={p.id} className="grid grid-cols-[36px_minmax(0,1fr)_minmax(56px,34%)_40px] items-center gap-2.5 text-[12.5px]">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded storage URL, tiny thumbnail
                  <img src={p.image} alt="" className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <Package className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <Link href={`/dashboard/products/${p.id}/edit`} className="truncate font-medium text-market-navy hover:underline">
                  {name}
                </Link>
                <span className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-market-or to-market-or-dark"
                    style={{ width: `${Math.max(4, (p.views / max) * 100)}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums text-market-navy">
                  <span className="sr-only">{t("topProducts.viewsSr")} </span>
                  {format.number(p.views)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </OverviewCard>
  );
}

/**
 * What buyers find through search. The search text itself is not stored
 * (analytics_events keeps only the entity it surfaced), so this lists the
 * company or products that appeared most — honest, and still actionable.
 */
export function SearchDiscoveryCard({ entries }: { entries: SearchEntry[] }) {
  const t = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <OverviewCard
      id="overview-search"
      title={t("search.title")}
      subtitle={t("search.subtitle")}
      aside={<Link href="/dashboard/analytics" className="text-xs font-semibold text-primary hover:underline">{t("search.stats")}</Link>}
    >
      {entries.length === 0 ? (
        <EmptyHint text={t("search.empty")} />
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <li key={e.entity_id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
              {localized(locale, e.name_en, e.name_fr, "—")}
              <span className="ml-1 font-semibold tabular-nums text-market-navy">{format.number(e.appearances)}</span>
              <span className="sr-only"> {t("search.appearancesSr")}</span>
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}

export function SuppliersCard({ suppliers }: { suppliers: SupplierMatch[] }) {
  const t = useTranslations("DashboardOverview");
  return (
    <OverviewCard
      id="overview-suppliers"
      title={t("suppliers.title")}
      aside={<Link href="/companies" className="text-xs font-semibold text-primary hover:underline">{t("suppliers.directory")}</Link>}
    >
      {suppliers.length === 0 ? (
        <EmptyHint text={t("suppliers.empty")} cta={{ href: "/companies", label: t("suppliers.browse") }} />
      ) : (
        <ul className="space-y-2">
          {suppliers.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5">
              {s.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- public company logo, tiny avatar
                <img src={s.logo_url} alt="" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-market-navy text-[11px] font-semibold text-market-or-light">
                  {s.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/companies/${s.id}`} className="block truncate text-[12.5px] font-medium text-market-navy hover:underline">
                  {s.name}
                </Link>
                <p className="truncate text-[11px] text-slate-500">{[s.city, s.province].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                {t("suppliers.verified")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}

export function MarketWatchCard({ data }: { data: MarketWatch }) {
  const t = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <OverviewCard
      id="overview-market"
      title={t("market.title")}
      aside={<Link href="/data-hub" className="text-xs font-semibold text-primary hover:underline">{t("market.dataHub")}</Link>}
    >
      {data.prices.length === 0 && !data.report ? (
        <EmptyHint text={t("market.empty")} />
      ) : (
        <ul>
          {data.prices.map((p) => {
            const Arrow = (p.changePct ?? 0) < 0 ? ArrowDownRight : ArrowUpRight;
            return (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto_64px] items-center gap-2 border-b border-slate-100 py-1.5 text-[12.5px]">
                <Link href={`/data-hub/prices/${p.id}`} className="truncate font-medium text-market-navy hover:underline">
                  {localized(locale, p.commodity_en, p.commodity_fr)}
                </Link>
                <span className="font-semibold tabular-nums text-market-navy">
                  {format.number(p.latest, { maximumFractionDigits: 2 })} {p.currency}/{p.unit}
                </span>
                {p.changePct === null ? (
                  <span className="text-right text-slate-400">—</span>
                ) : (
                  <span className={`inline-flex items-center justify-end gap-0.5 text-[11.5px] font-semibold tabular-nums ${p.changePct < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    <Arrow className="h-3 w-3" aria-hidden />
                    {format.number(Math.abs(p.changePct) / 100, { style: "percent", maximumFractionDigits: 1 })}
                  </span>
                )}
              </li>
            );
          })}
          {data.report && (
            <li className="flex gap-2 pt-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-market-or-dark" aria-hidden />
              <div className="min-w-0">
                <Link
                  href={`/data-hub/reports/${data.report.kind}/${data.report.slug}`}
                  className="block truncate text-[12.5px] font-medium text-market-navy hover:underline"
                >
                  {localized(locale, data.report.title_en, data.report.title_fr)}
                </Link>
                <p className="text-[11px] text-slate-500">{t("market.latestReport")}</p>
              </div>
            </li>
          )}
        </ul>
      )}
    </OverviewCard>
  );
}
