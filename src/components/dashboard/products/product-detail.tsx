"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Circle, Clock, ExternalLink, Eye, EyeOff, Package, Pencil, Search, ShieldAlert, Store } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { useProduct } from "@/hooks/use-products";
import { COMPANY_STATUS } from "@/constants/status";
import { trendOf } from "@/lib/dashboard/overview/metrics";
import {
  MIN_GALLERY,
  MIN_PRODUCT_DESCRIPTION,
  MIN_SPECS,
  PRODUCT_METRICS_DAYS,
  QUALITY_KEYS,
  fetchOwnerProductMetrics,
  localizedName,
  productQuality,
  productVisibility,
  type ProductVisibility,
} from "@/lib/dashboard/products";
import { specEntries, toSpecFields } from "@/lib/products/specs";
import { pricingDisplay } from "@/lib/products/pricing";
import { PRODUCT_LANGS, type ProductLang } from "@/lib/dashboard/product-texts";
import { KpiTile, KpiTileSkeleton } from "@/components/dashboard/overview/kpi-tile";
import { CardSkeleton } from "@/components/dashboard/overview/overview-card";
import { ProductActionsMenu, ProductVisibilityPill } from "./product-actions";

const CARD = "rounded-2xl bg-white p-5 ring-1 ring-slate-200/70";

const VISIBILITY_CARD: Record<ProductVisibility, { card: string; icon: string; Icon: typeof Store }> = {
  live: { card: "bg-emerald-50 ring-emerald-100", icon: "text-emerald-700", Icon: Store },
  awaiting: { card: "bg-market-cream ring-market-or/30", icon: "text-market-or-dark", Icon: ShieldAlert },
  hidden: { card: "bg-slate-100 ring-slate-200", icon: "text-slate-600", Icon: EyeOff },
};

/**
 * The seller's view of one product: what buyers see (photos, texts,
 * characteristics) next to what only the seller needs — status, views, how
 * complete the listing is — with every management action one click away.
 */
export function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations("Dashboard.products");
  const tForm = useTranslations("Dashboard.productForm");
  const tPricing = useTranslations("ProductPricing");
  const format = useFormatter();
  const locale = useLocale();
  const { user } = useAuth();
  const { data: companies, isLoading: companiesLoading } = useCompanies(user?.id);
  const product = useProduct(productId);
  const metrics = useQuery({
    queryKey: ["products", "metrics", PRODUCT_METRICS_DAYS],
    queryFn: () => fetchOwnerProductMetrics(PRODUCT_METRICS_DAYS),
  });
  const categoryId = product.data?.category_id;
  const template = useQuery({
    queryKey: ["spec-fields", categoryId],
    queryFn: async () => {
      const { data } = await createClient()
        .from("category_spec_fields")
        .select("key, label_en, label_fr, field_type, unit, options, required, sort_order")
        .eq("category_id", categoryId!);
      return toSpecFields(data);
    },
    enabled: !!categoryId,
  });

  const [photo, setPhoto] = React.useState(0);
  const [lang, setLang] = React.useState<ProductLang>(locale === "fr" ? "fr" : "en");

  const back = (
    <Link
      href="/dashboard/products"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      {t("backToProducts")}
    </Link>
  );

  if (product.isLoading || companiesLoading) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
        {back}
        <CardSkeleton rows={2} />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  const p = product.data;
  // Owned = the product's company is one of mine. RLS would also show a verified
  // company's public product to anyone, and this page is for its seller only.
  const company = p ? (companies ?? []).find((c) => c.id === p.company_id) : undefined;
  if (!p || !company) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
        {back}
        <div className={cn(CARD, "text-center")}>
          <p className="text-sm text-slate-500">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const name = localizedName(p, locale);
  const visibility = productVisibility(p, company.status);
  const tone = VISIBILITY_CARD[visibility];
  const images = p.images ?? [];
  const current = images[Math.min(photo, images.length - 1)];
  const quality = productQuality(p);
  const metric = metrics.data?.products[p.id];
  const trend = metric ? trendOf(metric.views, metric.previous_views) : null;
  const specs = specEntries(p.specs, { fields: template.data ?? [], locale, yes: tForm("specs.yes"), no: tForm("specs.no") });
  const categoryName = p.categories ? (locale === "fr" ? p.categories.name_fr : p.categories.name_en) : null;
  const pricing = pricingDisplay(p, tPricing, locale);
  const text = {
    name: (lang === "fr" ? p.name_fr : p.name_en) || "",
    description: (lang === "fr" ? p.description_fr : p.description_en) || "",
  };
  const editHref = `/dashboard/products/${p.id}/edit`;
  const date = (value: string) => format.dateTime(new Date(value), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pt-2">
      <header>
        {back}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-[260px]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 font-display text-[26px] font-semibold leading-tight tracking-tight text-market-navy sm:text-[30px]">
                {name}
              </h1>
              <ProductVisibilityPill visibility={visibility} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[categoryName ?? t("noCategory"), company.name].join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {visibility === "live" && (
              <Link
                href={`/products/${p.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {t("detail.publicPage")}
              </Link>
            )}
            <Link
              href={editHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("actions.edit")}
            </Link>
            <ProductActionsMenu product={p} onDetailPage afterDelete="list" triggerClassName="bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <section aria-labelledby="detail-photos" className={CARD}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="detail-photos" className="font-display text-base font-semibold text-market-navy">{t("detail.photos")}</h2>
              <span className="text-xs font-medium tabular-nums text-slate-500">{t("detail.photoCount", { count: images.length })}</span>
            </div>
            {images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 px-4 py-10 text-center">
                <Package className="h-8 w-8 text-slate-300" aria-hidden />
                <p className="text-sm font-semibold text-market-navy">{t("detail.noPhotos")}</p>
                <Link href={editHref} className="text-xs font-semibold text-market-navy underline underline-offset-4">
                  {t("detail.addPhotos")}
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- owner's own upload */}
                  <img src={current} alt={t("detail.photoAlt", { name, index: Math.min(photo, images.length - 1) + 1 })} className="aspect-[16/10] w-full object-contain" />
                </div>
                {images.length > 1 && (
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {images.map((src, i) => (
                      <li key={src}>
                        <button
                          type="button"
                          onClick={() => setPhoto(i)}
                          aria-label={t("detail.showPhoto", { index: i + 1 })}
                          aria-pressed={i === photo}
                          className={cn(
                            "block h-16 w-16 overflow-hidden rounded-xl ring-2 transition-colors",
                            i === photo ? "ring-market-navy" : "ring-transparent hover:ring-slate-300"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- owner's own upload */}
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="detail-texts" className={CARD}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="detail-texts" className="font-display text-base font-semibold text-market-navy">{t("detail.description")}</h2>
              <div role="tablist" aria-label={tForm("lang.label")} className="inline-flex rounded-full bg-slate-100 p-1">
                {PRODUCT_LANGS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="tab"
                    aria-selected={code === lang}
                    onClick={() => setLang(code)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      code === lang ? "bg-market-navy text-white" : "text-slate-600 hover:text-market-navy"
                    )}
                  >
                    {tForm(`lang.${code}`)}
                  </button>
                ))}
              </div>
            </div>
            {text.name || text.description ? (
              <>
                <p className="text-sm font-semibold text-market-navy">{text.name}</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{text.description}</p>
              </>
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{t("detail.noTranslation")}</p>
            )}
          </section>

          <section aria-labelledby="detail-pricing" className={CARD}>
            <h2 id="detail-pricing" className="mb-3 font-display text-base font-semibold text-market-navy">{tForm("pricing.title")}</h2>
            {pricing.price || pricing.minOrder ? (
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 text-[13px]">
                  <dt className="text-slate-500">{tPricing("price")}</dt>
                  <dd className="text-right font-semibold tabular-nums text-market-navy">
                    {pricing.price ? `${pricing.price} ${tPricing("perUnit", { unit: pricing.unit ?? "" })}` : tPricing("onRequest")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 text-[13px]">
                  <dt className="text-slate-500">{tPricing("minOrder")}</dt>
                  <dd className="text-right font-semibold tabular-nums text-market-navy">{pricing.minOrder ?? "—"}</dd>
                </div>
              </dl>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">{t("detail.noPricing")}</p>
                <Link href={editHref} className="text-xs font-semibold text-market-navy underline underline-offset-4">
                  {t("detail.addPricing")}
                </Link>
              </div>
            )}
          </section>

          <section aria-labelledby="detail-specs" className={CARD}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="detail-specs" className="font-display text-base font-semibold text-market-navy">{tForm("specs.title")}</h2>
              <span className="text-xs font-medium tabular-nums text-slate-500">{specs.length}</span>
            </div>
            {specs.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">{t("detail.noSpecs")}</p>
                <Link href={editHref} className="text-xs font-semibold text-market-navy underline underline-offset-4">
                  {t("detail.addSpecs")}
                </Link>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {specs.map((entry) => (
                  <div key={entry.label} className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5 text-[13px]">
                    <dt className="min-w-0 text-slate-500">{entry.label}</dt>
                    <dd className="min-w-0 text-right font-semibold text-market-navy">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <section aria-labelledby="detail-visibility" className={cn("rounded-2xl p-4 ring-1", tone.card)}>
            <div className="flex items-start gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white", tone.icon)} aria-hidden>
                <tone.Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 id="detail-visibility" className="text-[13px] font-semibold text-market-navy">{t(`detail.visibility.${visibility}.title`)}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{t(`detail.visibility.${visibility}.body`, { company: company.name })}</p>
                {visibility === "awaiting" && company.status !== COMPANY_STATUS.PENDING && (
                  <Link
                    href={`/dashboard/companies/${company.id}/verification`}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-market-navy px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-market-navy-deep"
                  >
                    {t("unverified.cta")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </section>

          {metrics.isError ? (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              {t("stats.viewsError")}
              <button type="button" onClick={() => metrics.refetch()} className="font-semibold underline">
                {t("retry")}
              </button>
            </div>
          ) : !metrics.data ? (
            <KpiTileSkeleton />
          ) : (
            <>
              <KpiTile
                highlight
                icon={Eye}
                label={t("stats.views", { days: PRODUCT_METRICS_DAYS })}
                value={format.number(metric?.views ?? 0)}
                delta={
                  trend
                    ? {
                        direction: trend.direction,
                        text:
                          trend.direction === "new"
                            ? t("detail.deltaNew")
                            : trend.direction === "flat"
                              ? t("detail.deltaFlat")
                              : format.number((trend.pct ?? 0) / 100, { style: "percent", maximumFractionDigits: 1 }),
                      }
                    : null
                }
                series={metric ? { values: metric.series, startDate: metrics.data.current_start } : undefined}
              />
              <div className={cn(CARD, "flex items-center gap-3 py-4")}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
                  <Search className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{t("detail.searchAppearances", { days: PRODUCT_METRICS_DAYS })}</p>
                  <p className="font-display text-xl font-semibold tabular-nums text-market-navy">{format.number(metric?.search_appearances ?? 0)}</p>
                </div>
              </div>
            </>
          )}

          <section aria-labelledby="detail-quality" className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <h2 id="detail-quality" className="font-display text-base font-semibold text-market-navy">{t("detail.quality.title")}</h2>
              <span className="font-display text-lg font-semibold tabular-nums text-market-navy">{quality.percent}%</span>
            </div>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
              <span
                className={cn("block h-full rounded-full", quality.percent === 100 ? "bg-emerald-500" : "bg-market-or-dark")}
                style={{ width: `${quality.percent}%` }}
              />
            </span>
            <ul className="mt-3 space-y-2">
              {QUALITY_KEYS.map((key) => {
                const done = !quality.missing.includes(key);
                return (
                  <li key={key} className="flex items-start gap-2 text-xs leading-relaxed">
                    {done ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
                    )}
                    <span className={done ? "text-slate-500" : "font-medium text-market-navy"}>
                      <span className="sr-only">{t(done ? "detail.quality.doneSr" : "detail.quality.todoSr")} </span>
                      {t(`detail.quality.items.${key}`, { photos: MIN_GALLERY, chars: MIN_PRODUCT_DESCRIPTION, specs: MIN_SPECS })}
                    </span>
                  </li>
                );
              })}
            </ul>
            {quality.missing.length > 0 && (
              <Link
                href={editHref}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-market-navy transition-colors hover:bg-slate-200"
              >
                {t("detail.quality.cta")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </section>

          <section aria-labelledby="detail-info" className={CARD}>
            <h2 id="detail-info" className="font-display text-base font-semibold text-market-navy">{t("detail.info.title")}</h2>
            <dl className="mt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {t("detail.info.created")}
                </dt>
                <dd className="font-medium text-market-navy">{date(p.created_at)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  {t("detail.info.updated")}
                </dt>
                <dd className="font-medium text-market-navy">{date(p.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
