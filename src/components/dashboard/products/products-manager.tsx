"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Eye, ImageOff, LayoutGrid, List, Package, Plus, Search, ShieldAlert, Sparkles, Store } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/use-products";
import { COMPANY_STATUS } from "@/constants/status";
import {
  PRODUCT_METRICS_DAYS,
  PRODUCT_SORTS,
  fetchOwnerProductMetrics,
  filterProducts,
  localizedName,
  productQuality,
  productVisibility,
  type OwnerProduct,
  type ProductFilters,
  type ProductSort,
  type VisibilityFilter,
} from "@/lib/dashboard/products";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { ProductActionsMenu, ProductVisibilityPill } from "./product-actions";

const FIELD =
  "h-10 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] text-slate-700 outline-none transition-colors focus:border-market-navy";
const VISIBILITY_FILTERS: VisibilityFilter[] = ["all", "live", "awaiting", "hidden"];

function StatTile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-market-navy">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{hint}</p>}
    </div>
  );
}

function QualityBar({ percent }: { percent: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <span
          className={cn("block h-full rounded-full", percent === 100 ? "bg-emerald-500" : "bg-market-or-dark")}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="text-[11.5px] font-semibold tabular-nums text-slate-600">{percent}%</span>
    </span>
  );
}

function Thumb({ product, className }: { product: OwnerProduct; className?: string }) {
  const src = product.images?.[0];
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden bg-slate-100 text-slate-300", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- owner's own upload, small thumbnail
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <Package className="h-6 w-6" aria-hidden />
      )}
    </span>
  );
}

interface ProductsManagerProps {
  companyId: string;
  company: { name: string; status: string };
}

/**
 * The seller's catalogue: figures at a glance, then a searchable, filterable
 * list (cards or rows) where each product carries its status, its views and
 * how complete its listing is, plus the actions menu.
 */
export function ProductsManager({ companyId, company }: ProductsManagerProps) {
  const t = useTranslations("Dashboard.products");
  const format = useFormatter();
  const locale = useLocale();
  const { data: products, isLoading, isError, refetch } = useProducts(companyId);
  const metrics = useQuery({
    queryKey: ["products", "metrics", PRODUCT_METRICS_DAYS],
    queryFn: () => fetchOwnerProductMetrics(PRODUCT_METRICS_DAYS),
  });

  const [filters, setFilters] = React.useState<ProductFilters>({ search: "", categoryId: "", visibility: "all", sort: "recent" });
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const set = (patch: Partial<ProductFilters>) => setFilters((prev) => ({ ...prev, ...patch }));

  const all = React.useMemo(() => products ?? [], [products]);
  const perProduct = metrics.data?.products;
  const shown = React.useMemo(
    () => filterProducts(all, filters, { locale, companyStatus: company.status, metrics: perProduct }),
    [all, filters, locale, company.status, perProduct]
  );
  const categories = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of all) if (p.categories) map.set(p.categories.id, locale === "fr" ? p.categories.name_fr : p.categories.name_en);
    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [all, locale]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/70" />
          ))}
        </div>
        <CardSkeleton rows={6} />
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
        {t("loadError")}
        <button type="button" onClick={() => refetch()} className="font-semibold underline">
          {t("retry")}
        </button>
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-market-navy p-8 text-center text-white sm:p-10">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-market-or/25 blur-3xl" />
        <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10 text-market-or-light ring-1 ring-white/15">
          <Package className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="relative mt-4 font-display text-xl font-semibold">{t("emptyTitle")}</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-white/70">{t("emptyBody")}</p>
        <Link
          href="/dashboard/products/new"
          className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-market-navy transition-colors hover:bg-market-or-light"
        >
          {t("addProduct")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const live = all.filter((p) => productVisibility(p, company.status) === "live").length;
  const totalViews = all.reduce((sum, p) => sum + (perProduct?.[p.id]?.views ?? 0), 0);
  const toImprove = all.filter((p) => productQuality(p).percent < 100).length;
  const verified = company.status === COMPANY_STATUS.VERIFIED;
  const filtered = filters.search !== "" || filters.categoryId !== "" || filters.visibility !== "all";
  const views = (p: OwnerProduct) => (perProduct ? format.number(perProduct[p.id]?.views ?? 0) : "—");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile icon={Package} label={t("stats.total")} value={format.number(all.length)} />
        <StatTile icon={Store} label={t("stats.live")} value={format.number(live)} hint={t("stats.liveHint", { total: all.length })} />
        <StatTile
          icon={Eye}
          label={t("stats.views", { days: PRODUCT_METRICS_DAYS })}
          value={metrics.data ? format.number(totalViews) : "—"}
          hint={metrics.isError ? t("stats.viewsError") : undefined}
        />
        <StatTile icon={Sparkles} label={t("stats.toImprove")} value={format.number(toImprove)} hint={t("stats.toImproveHint")} />
      </div>

      {/* The publication rule, when it is what keeps the catalogue private. */}
      {!verified && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-market-cream p-4 ring-1 ring-market-or/30">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-market-or-dark" aria-hidden>
            <ShieldAlert className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1 basis-[240px]">
            <p className="text-[13px] font-semibold text-market-navy">{t("unverified.title")}</p>
            <p className="text-xs text-slate-600">{t("unverified.body", { company: company.name })}</p>
          </div>
          <Link
            href={`/dashboard/companies/${companyId}/verification`}
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            {t("unverified.cta")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}

      <section aria-label={t("title")} className="rounded-2xl bg-white ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="relative min-w-0 flex-1 basis-[220px]">
            <span className="sr-only">{t("toolbar.search")}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder={t("toolbar.search")}
              className={cn(FIELD, "w-full pl-10")}
            />
          </label>
          {categories.length > 1 && (
            <select aria-label={t("toolbar.category")} value={filters.categoryId} onChange={(e) => set({ categoryId: e.target.value })} className={FIELD}>
              <option value="">{t("toolbar.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label={t("toolbar.status")}
            value={filters.visibility}
            onChange={(e) => set({ visibility: e.target.value as VisibilityFilter })}
            className={FIELD}
          >
            {VISIBILITY_FILTERS.map((v) => (
              <option key={v} value={v}>
                {v === "all" ? t("toolbar.allStatuses") : t(`visibility.${v}`)}
              </option>
            ))}
          </select>
          <select aria-label={t("toolbar.sort")} value={filters.sort} onChange={(e) => set({ sort: e.target.value as ProductSort })} className={FIELD}>
            {PRODUCT_SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`toolbar.sorts.${s}`)}
              </option>
            ))}
          </select>
          <div role="group" aria-label={t("toolbar.view")} className="inline-flex rounded-full bg-slate-100 p-1">
            {(["grid", "list"] as const).map((mode) => {
              const Icon = mode === "grid" ? LayoutGrid : List;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  aria-label={t(`toolbar.views.${mode}`)}
                  title={t(`toolbar.views.${mode}`)}
                  onClick={() => setView(mode)}
                  className={cn(
                    "grid h-8 w-9 place-items-center rounded-full transition-colors",
                    view === mode ? "bg-market-navy text-white" : "text-slate-500 hover:text-market-navy"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>

        <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500" aria-live="polite">
          {t("toolbar.count", { shown: shown.length, total: all.length })}
        </p>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 pb-10 pt-6 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400" aria-hidden>
              <ImageOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-market-navy">{t("noMatch")}</p>
            {filtered && (
              <button
                type="button"
                onClick={() => setFilters({ search: "", categoryId: "", visibility: "all", sort: filters.sort })}
                className="text-xs font-semibold text-market-navy underline underline-offset-4"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((product) => {
              const name = localizedName(product, locale);
              const quality = productQuality(product);
              return (
                <li key={product.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl ring-1 ring-slate-200/80 transition-colors hover:ring-market-navy/40">
                  <div className="relative">
                    <Thumb product={product} className="aspect-[4/3] w-full" />
                    <ProductVisibilityPill visibility={productVisibility(product, company.status)} className="absolute left-2.5 top-2.5 bg-white/95" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-3.5">
                    <div className="flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        {/* The whole card opens the product; the menu sits above the stretched link. */}
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="block truncate text-sm font-semibold text-market-navy after:absolute after:inset-0 after:content-['']"
                        >
                          {name}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {product.categories ? (locale === "fr" ? product.categories.name_fr : product.categories.name_en) : t("noCategory")}
                        </p>
                      </div>
                      <ProductActionsMenu product={product} triggerClassName="relative z-10 -mr-1.5 -mt-1" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {t("viewsCount", { count: views(product) })}
                      </span>
                      <QualityBar percent={quality.percent} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="text-[11.5px] font-semibold text-slate-500">
                  <th className="rounded-l-xl bg-slate-50 px-3 py-2.5 font-semibold">{t("colName")}</th>
                  <th className="bg-slate-50 px-3 py-2.5 font-semibold">{t("toolbar.status")}</th>
                  <th className="bg-slate-50 px-3 py-2.5 text-right font-semibold">{t("colViews", { days: PRODUCT_METRICS_DAYS })}</th>
                  <th className="bg-slate-50 px-3 py-2.5 font-semibold">{t("colQuality")}</th>
                  <th className="bg-slate-50 px-3 py-2.5 font-semibold">{t("colUpdated")}</th>
                  <th className="rounded-r-xl bg-slate-50 px-3 py-2.5">
                    <span className="sr-only">{t("colActions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <Link href={`/dashboard/products/${product.id}`} className="flex min-w-0 items-center gap-3">
                        <Thumb product={product} className="h-11 w-11 rounded-xl" />
                        <span className="min-w-0">
                          <span className="block max-w-[260px] truncate font-semibold text-market-navy hover:underline">{localizedName(product, locale)}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {product.categories ? (locale === "fr" ? product.categories.name_fr : product.categories.name_en) : t("noCategory")}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <ProductVisibilityPill visibility={productVisibility(product, company.status)} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-market-navy">{views(product)}</td>
                    <td className="px-3 py-2.5">
                      <QualityBar percent={productQuality(product).percent} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                      {format.dateTime(new Date(product.updated_at), { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-1 py-2.5 text-right">
                      <ProductActionsMenu product={product} triggerClassName="ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link
        href="/dashboard/products/new"
        className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-5 transition-colors hover:border-market-navy hover:bg-white"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200" aria-hidden>
          <Plus className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-market-navy">{t("addAnother.title")}</span>
          <span className="block text-xs text-slate-500">{t("addAnother.body")}</span>
        </span>
      </Link>
    </div>
  );
}
