import { getTranslations } from "next-intl/server";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Globe2,
  Layers,
  Link2,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ftsEntityIds, orderByRank } from "@/components/list-pages/fts-ids";
import {
  FacetCheckboxes,
  type FacetOption,
} from "@/components/marketplace/products/facet-checkboxes";
import { OfferCard, type OfferCardData } from "@/components/marketplace/products/offer-card";
import {
  OFFER_CARD_SELECT,
  toOfferCardData,
  type OfferCardRow,
} from "@/components/marketplace/products/offer-card-data";
import { FiltersPanel } from "@/components/marketplace/products/filters-panel";
import {
  isOrigin,
  placeOf as offerPlaceOf,
  tierGroup,
  type Origin,
} from "@/lib/marketplace/offers";
import { countOffersByOrigin } from "@/lib/marketplace/queries";

const NO_MATCH_UUID = "00000000-0000-0000-0000-000000000000";
/** The catalogue is small; facets and filters run over this many rows. */
const MAX_ROWS = 500;

const DIRECTIONS = [
  { key: "import", Icon: ArrowDownRight },
  { key: "export", Icon: ArrowUpRight },
] as const;

const CHAIN_LINKS = [
  { key: "logistics", href: "/market/logistics" },
  { key: "finance", href: "/market/finance" },
  { key: "compliance", href: "/market/facilitation" },
] as const;

/** Facet URL params, in chip order. */
const FACET_PARAMS = ["from", "cat", "tier"] as const;

type ProductRow = OfferCardRow;

function listParam(value: string | undefined): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

function countBy<T>(rows: T[], pick: (r: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/**
 * Marketplace offers. `?origin=` picks the direction of trade from the
 * seller's declared profile — "import" is an international company selling
 * into the DRC, "export" a Congolese one. Sidebar facets (origin place,
 * category, verification) are comma-separated URL params computed over the
 * direction's full set. The search band and the sidebar stay pinned while the
 * offers scroll.
 */
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "MarketProducts" });
  const supabase = await createServerSupabaseClient();
  const loc = locale as Locale;

  const origin: Origin | null = isOrigin(sp.origin) ? sp.origin : null;
  const query = (sp.q ?? "").trim();
  const filters = {
    from: listParam(sp.from),
    cat: listParam(sp.cat),
    tier: listParam(sp.tier),
  };

  const [matchedIds, directionCounts] = await Promise.all([
    ftsEntityIds(supabase, query, locale as "en" | "fr", "product"),
    countOffersByOrigin(supabase),
  ]);

  let q = supabase
    .from("products")
    .select(OFFER_CARD_SELECT)
    // RLS already hides these from visitors; stated here so an owner or a staff
    // member browsing the market sees exactly what the public sees.
    .eq("is_published", true)
    .eq("companies.status", "verified");
  if (origin) {
    q = q.eq("companies.registration_profile", origin === "import" ? "international" : "congolese");
  }
  if (matchedIds !== null) {
    q = q.in("id", matchedIds.length === 0 ? [NO_MATCH_UUID] : matchedIds);
  }
  const { data } = await q.order("created_at", { ascending: false }).limit(MAX_ROWS);

  let base = ((data ?? []) as unknown as ProductRow[]).filter((p) => p.companies);
  if (query && matchedIds && matchedIds.length > 0) base = orderByRank(base, matchedIds);

  const placeOf = (p: ProductRow) => (p.companies ? offerPlaceOf(p.companies) : null);
  // The origin facet is by province only on the export side (all Congolese);
  // elsewhere it compares countries.
  const facetPlaceOf = (p: ProductRow) =>
    origin === "export" ? placeOf(p) : (p.companies?.country ?? null);

  const rows = base.filter(
    (p) =>
      (filters.from.length === 0 || filters.from.includes(facetPlaceOf(p) ?? "")) &&
      (filters.cat.length === 0 || filters.cat.includes(p.categories?.id ?? "")) &&
      (filters.tier.length === 0 ||
        filters.tier.includes(tierGroup(p.companies?.verification_tier ?? null) ?? "")),
  );

  // Facet options come from the unfiltered direction set, most common first.
  const toOptions = (counts: Map<string, number>, label: (k: string) => string): FacetOption[] =>
    [...counts.entries()]
      .map(([value, count]) => ({ value, label: label(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const categoryNames = new Map(
    base
      .filter((p) => p.categories)
      .map((p) => [p.categories!.id, pickLocalized(p.categories!, "name", loc)]),
  );
  const tierLabel = (k: string) => t(`filters.tiers.${k}`);
  const placeOptions = toOptions(countBy(base, facetPlaceOf), (k) => k);
  const categoryOptions = toOptions(
    countBy(base, (p) => p.categories?.id ?? null),
    (k) => categoryNames.get(k) ?? k,
  );
  const tierOptions = toOptions(
    countBy(base, (p) => tierGroup(p.companies?.verification_tier ?? null)),
    tierLabel,
  );

  const factLabels = { moq: t("card.moq"), leadTime: t("card.leadTime"), yes: t("card.yes"), no: t("card.no") };
  const offers: OfferCardData[] = rows.map((p) =>
    toOfferCardData({ ...p, companies: p.companies! }, loc, factLabels),
  );

  // Active filter chips — each links to the same URL minus that one value.
  const chipLabel = (param: (typeof FACET_PARAMS)[number], value: string) =>
    param === "cat"
      ? (categoryNames.get(value) ?? value)
      : param === "tier"
        ? tierLabel(value)
        : value;
  const withoutValue = (param: string, value: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (!v) continue;
      if (k === param) {
        const rest = listParam(v).filter((x) => x !== value);
        if (rest.length > 0) next.set(k, rest.join(","));
      } else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/products?${qs}` : "/products";
  };
  const chips = FACET_PARAMS.flatMap((param) =>
    filters[param].map((value) => ({
      key: `${param}:${value}`,
      label: chipLabel(param, value),
      href: withoutValue(param, value),
    })),
  );
  const activeCount = chips.length;
  const clearHref = origin ? `/products?origin=${origin}` : "/products";
  const otherDirection: Origin = origin === "import" ? "export" : "import";

  return (
    <div data-page-end="flush" className="bg-slate-50">
      {/* Header band — same atmosphere as the marketplace hero, compact. */}
      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-[360px] w-[360px] rounded-full bg-primary/40 blur-[110px]" />
          <div className="absolute -bottom-40 right-[-5%] h-[320px] w-[320px] rounded-full bg-market-or/10 blur-[110px]" />
          {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_25%_30%,black_15%,transparent_65%)]" /> */}
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <nav
            aria-label={t("header.breadcrumb")}
            className="flex items-center gap-1 text-xs text-white/60"
          >
            <Link
              href="/market"
              className="transition-colors duration-150 ease-out hover:text-white"
            >
              {t("header.crumbMarket")}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="text-white/90">
              {origin ? t(`directions.${origin}.title`) : t("results.heading.all")}
            </span>
          </nav>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("header.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">{t("header.lead")}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {DIRECTIONS.map(({ key, Icon }) => {
              const active = key === origin;
              return (
                <Link
                  key={key}
                  href={`/products?origin=${key}`}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3.5 rounded-xl p-4 ring-1 transition-colors duration-150 ease-out ${
                    active
                      ? "bg-white text-[var(--color-landing-navy)] shadow-xl shadow-black/20 ring-white"
                      : "bg-white/5 text-white ring-white/15 backdrop-blur-md hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${
                      active
                        ? "bg-[var(--color-landing-navy)] text-market-or"
                        : "bg-white/10 text-market-or"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold">
                      {t(`directions.${key}.title`)}
                    </span>
                    <span
                      className={`mt-0.5 block text-[13px] ${active ? "text-slate-600" : "text-white/70"}`}
                    >
                      {t(`directions.${key}.body`)}
                    </span>
                  </span>
                  <span
                    className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      active ? "bg-primary/10 text-primary" : "bg-white/10 text-white/85"
                    }`}
                  >
                    {t("results.count", { count: directionCounts[key] })}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search pins under the sticky navbar (h-16) so it stays put while the
          offers scroll; the facet sidebar pins right below it. */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <form
          action={`/${locale}/products`}
          method="get"
          role="search"
          className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 md:px-6"
        >
          {origin && <input type="hidden" name="origin" value={origin} />}
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pl-3.5 transition-colors duration-150 ease-out focus-within:border-primary/60">
            <Search className="h-4 w-4 flex-none text-slate-400" aria-hidden />
            <label htmlFor="offer-search" className="sr-only">
              {t("search.label")}
            </label>
            <input
              id="offer-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t("search.placeholder")}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex-none rounded-lg bg-market-red px-4 py-2 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-market-red-dark"
            >
              {t("search.cta")}
            </button>
          </div>
        </form>
      </div>

      {/* Facets + offers */}
      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* navbar 4rem + search band 4rem + 1.5rem gap. The card is capped at the viewport;
            only its body scrolls (FiltersPanel), so the header and rounded corners stay put. */}
        <aside className="flex h-fit flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 lg:sticky lg:top-[9.5rem] lg:max-h-[calc(100vh-11rem)]">
          <FiltersPanel
            title={t("filters.title")}
            activeCount={activeCount}
            clearSlot={
              activeCount > 0 && (
                <Link
                  href={clearHref}
                  className="text-xs font-semibold text-slate-500 underline-offset-4 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)] hover:underline"
                >
                  {t("filters.clear")}
                </Link>
              )
            }
          >
            <div className="divide-y divide-slate-200/80">
              <FacetCheckboxes
                param="from"
                legend={t(origin === "export" ? "filters.province" : "filters.country")}
                icon={
                  origin === "export" ? (
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Globe2 className="h-3.5 w-3.5" aria-hidden />
                  )
                }
                options={placeOptions}
              />
              <FacetCheckboxes
                param="cat"
                legend={t("filters.sector")}
                icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
                options={categoryOptions}
              />
              <FacetCheckboxes
                param="tier"
                legend={t("filters.verification")}
                icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}
                options={tierOptions}
              />

              <div className="py-4 last:pb-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-landing-navy)]">
                  <Link2 className="h-4 w-4 text-slate-400" aria-hidden />
                  {t("filters.chain")}
                </p>
                <ul className="-mx-2 mt-2.5 space-y-0.5">
                  {CHAIN_LINKS.map(({ key, href }) => (
                    <li key={key}>
                      <Link
                        href={href}
                        className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-[var(--color-landing-navy)]"
                      >
                        {t(`chain.${key}`)}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-market-or transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FiltersPanel>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[var(--color-landing-navy)]">
              {t(`results.heading.${origin ?? "all"}`)}
            </h2>
            <p className="text-xs text-slate-500">
              {t("results.count", { count: offers.length })} ·{" "}
              {t(query ? "results.sortRelevance" : "results.sortNewest")}
            </p>
          </div>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.key}>
                  <Link
                    href={c.href}
                    scroll={false}
                    aria-label={t("filters.removeFilter", { label: c.label })}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-2 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-150 ease-out hover:border-slate-300"
                  >
                    {c.label}
                    <X className="h-3 w-3 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {offers.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <PackageSearch className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-4 font-display text-base font-bold text-[var(--color-landing-navy)]">
                {t("empty.title")}
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {t(activeCount > 0 || query ? "empty.bodyFiltered" : "empty.body")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  href="/request"
                  className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
                >
                  {t("banner.cta")}
                </Link>
                {activeCount > 0 ? (
                  <Link
                    href={clearHref}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-50"
                  >
                    {t("filters.clear")}
                  </Link>
                ) : (
                  origin && (
                    <Link
                      href={`/products?origin=${otherDirection}`}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-50"
                    >
                      {t(`empty.see.${otherDirection}`)}
                    </Link>
                  )
                )}
              </div>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((o) => (
                <li key={o.id}>
                  <OfferCard offer={o} />
                </li>
              ))}
            </ul>
          )}

          <div className="relative isolate mt-5 flex flex-col gap-4 overflow-hidden rounded-2xl bg-market-navy p-6 sm:flex-row sm:items-center sm:justify-between">
            <div
              aria-hidden
              className="absolute -right-16 -top-24 -z-10 h-[260px] w-[260px] rounded-full bg-primary/40 blur-[90px]"
            />
            <div>
              <p className="font-display text-lg font-bold text-white">{t("banner.title")}</p>
              <p className="mt-1 text-[13px] text-white/75">{t("banner.body")}</p>
            </div>
            <Link
              href="/request"
              className="group inline-flex flex-none items-center gap-1.5 self-start rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark sm:self-auto"
            >
              {t("banner.cta")}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
