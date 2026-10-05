import { getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown, Search } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";
import {
  OFFER_CARD_SELECT,
  toOfferCardData,
  type OfferCardRow,
} from "@/components/marketplace/products/offer-card-data";
import { HomeMarketGrid, type MarketTab } from "./home-market-grid";

/** Sector tabs shown next to "All", busiest first. */
const MAX_TABS = 4;
const TRENDS = 6;
const CARDS_PER_TAB = 3;

const FIELD_LABEL = "block text-[11px] font-semibold text-[var(--color-landing-navy)]";
const SELECT =
  "w-full appearance-none bg-transparent pr-6 text-[13px] text-slate-500 focus:outline-none";

/**
 * Homepage section 3 — "What's moving right now": a search bar that lands on
 * the catalogue with its real filter params (q, cat, origin), trending
 * categories, and the newest offers by sector using the catalogue's own card.
 */
export async function HomeMarket({ locale }: { locale: string }) {
  const loc = locale as Locale;
  const [t, tProducts] = await Promise.all([
    getTranslations({ locale, namespace: "HomeMarket" }),
    getTranslations({ locale, namespace: "MarketProducts" }),
  ]);
  const supabase = await createServerSupabaseClient();
  const [productsRes, sectorsRes] = await Promise.all([
    supabase
      .from("products")
      .select(OFFER_CARD_SELECT)
      .eq("is_published", true)
      .eq("companies.status", "verified")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("sectors").select("id, slug, name_en, name_fr"),
  ]);

  const rows = ((productsRes.data ?? []) as unknown as OfferCardRow[]).filter(
    (p): p is OfferCardRow & { companies: NonNullable<OfferCardRow["companies"]> } => p.companies !== null,
  );
  const factLabels = { moq: tProducts("card.moq"), leadTime: tProducts("card.leadTime"), yes: tProducts("card.yes"), no: tProducts("card.no") };
  const card = (p: (typeof rows)[number]) => toOfferCardData(p, loc, factLabels);

  // Categories present in the catalogue, with their product counts.
  const categories = new Map<string, { id: string; label: string; sectorId: string | null; count: number }>();
  for (const p of rows) {
    if (!p.categories) continue;
    const c = categories.get(p.categories.id);
    if (c) c.count++;
    else
      categories.set(p.categories.id, {
        id: p.categories.id,
        label: pickLocalized(p.categories, "name", loc),
        sectorId: p.categories.sector_id,
        count: 1,
      });
  }
  const categoryList = [...categories.values()];

  const sectorTabs: MarketTab[] = (sectorsRes.data ?? [])
    .map((s) => {
      const sectorRows = rows.filter((p) => p.categories?.sector_id === s.id);
      const catIds = categoryList.filter((c) => c.sectorId === s.id).map((c) => c.id);
      return {
        key: s.slug,
        label: pickLocalized(s, "name", loc),
        count: sectorRows.length,
        href: `/products?cat=${catIds.join(",")}`,
        cards: sectorRows.slice(0, CARDS_PER_TAB).map(card),
      };
    })
    .filter((tab) => tab.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TABS);

  const tabs: MarketTab[] = [
    { key: "all", label: t("all"), count: rows.length, href: "/products", cards: rows.slice(0, CARDS_PER_TAB).map(card) },
    ...sectorTabs,
  ];
  const trends = [...categoryList].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, TRENDS);
  const categoryOptions = [...categoryList].sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <HomeSection id="market-live" panel>
      <MotionEnter>
        <HomeSectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          action={
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-market-or-dark transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)]"
            >
              {t("viewAll")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
          }
        />

        {/* Search — plain GET form onto the catalogue's own params. */}
        <form
          action={`/${locale}/products`}
          method="get"
          role="search"
          aria-label={t("search.label")}
          className="mt-6 grid gap-1 rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_30px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 md:grid-cols-[minmax(0,1fr)_190px_190px_auto] md:items-center"
        >
          <label className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-150 ease-out focus-within:bg-slate-50">
            <Search className="h-4 w-4 flex-none text-slate-400" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className={FIELD_LABEL}>{t("search.what")}</span>
              <input
                name="q"
                type="search"
                placeholder={t("search.whatPh")}
                className="w-full bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </span>
          </label>
          <label className="relative rounded-xl px-3 py-2 transition-colors duration-150 ease-out focus-within:bg-slate-50 md:border-l md:border-slate-200 md:rounded-none">
            <span className={FIELD_LABEL}>{t("search.category")}</span>
            <select name="cat" defaultValue="" className={SELECT}>
              <option value="">{t("search.allCategories")}</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-2.5 right-3 h-3.5 w-3.5 text-slate-400" aria-hidden />
          </label>
          <label className="relative rounded-xl px-3 py-2 transition-colors duration-150 ease-out focus-within:bg-slate-50 md:border-l md:border-slate-200 md:rounded-none">
            <span className={FIELD_LABEL}>{t("search.direction")}</span>
            <select name="origin" defaultValue="" className={SELECT}>
              <option value="">{t("search.allDirections")}</option>
              <option value="import">{t("search.import")}</option>
              <option value="export">{t("search.export")}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-2.5 right-3 h-3.5 w-3.5 text-slate-400" aria-hidden />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-market-or px-5 py-3 text-[13px] font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t("search.submit")}
          </button>
        </form>

        {trends.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1">
            <span className="mr-1 text-xs text-slate-500">{t("trends")}</span>
            {trends.map((c) => (
              <Link
                key={c.id}
                href={`/products?cat=${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)] hover:ring-slate-300"
              >
                <span className="h-1 w-1 rounded-full bg-market-or" aria-hidden />
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </MotionEnter>

      <HomeMarketGrid tabs={tabs} />
    </HomeSection>
  );
}
