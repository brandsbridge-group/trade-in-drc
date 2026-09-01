import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { VERIFICATION_TIER } from "@/constants/status";
import {
  Armchair,
  ArrowRight,
  BadgeCheck,
  Boxes,
  BrickWall,
  Cog,
  HeartPulse,
  Leaf,
  MapPin,
  Monitor,
  Mountain,
  Settings2,
  Shirt,
  ShoppingCart,
  Zap,
} from "lucide-react";

/* Fallback product photos extracted from the customer's design artwork. */
const FALLBACK_PRODUCT_IMAGES = [
  "/images/home/products/copper-cathodes.jpg",
  "/images/home/products/coffee-beans.jpg",
  "/images/home/products/solar-panels.jpg",
  "/images/home/products/safety-equipment.jpg",
  "/images/home/products/cassava-flour.jpg",
  "/images/home/products/timber.jpg",
];

/* The 12 marketplace categories exactly as in the customer design (colored
 * glyphs, two-line labels). Each resolves to a real sector via keyword match
 * so the chip links into the live product directory. */
const DESIGN_CATEGORIES: Array<{ key: string; match: RegExp; Icon: typeof Leaf; className: string }> = [
  { key: "agriculture", match: /agri|agro|food/i, Icon: Leaf, className: "text-green-600" },
  { key: "mining", match: /min(e|ing|eral)/i, Icon: Mountain, className: "text-amber-800" },
  { key: "construction", match: /construc|infra|material/i, Icon: BrickWall, className: "text-market-red" },
  { key: "industrial", match: /industr|manufactur/i, Icon: Cog, className: "text-blue-600" },
  { key: "energy", match: /energ|electric/i, Icon: Zap, className: "text-yellow-500" },
  { key: "textiles", match: /textile|fashion|apparel/i, Icon: Shirt, className: "text-purple-600" },
  { key: "fmcg", match: /fmcg|consumer|commerce|retail|beverage/i, Icon: ShoppingCart, className: "text-green-500" },
  { key: "pharma", match: /pharma|health|medic/i, Icon: HeartPulse, className: "text-sky-500" },
  { key: "logistics", match: /logisti|transport|packag/i, Icon: Boxes, className: "text-amber-600" },
  { key: "machinery", match: /machin|spare|equip/i, Icon: Settings2, className: "text-slate-700" },
  { key: "digital", match: /digital|tech|telecom|\bit\b/i, Icon: Monitor, className: "text-indigo-600" },
  { key: "furniture", match: /furnit|office|wood|forest|timber/i, Icon: Armchair, className: "text-amber-700" },
];

function isVerifiedTier(tier: string | null): boolean {
  return tier === VERIFICATION_TIER.VERIFIED || tier === VERIFICATION_TIER.PREMIUM;
}

interface ShowcaseProps {
  locale: string;
  sectors: Array<{ id: string; label: string }>;
}

function SectionHeading({ title, moreHref, moreLabel }: { title: string; moreHref?: string; moreLabel?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="font-display text-lg font-bold text-market-navy">{title}</h2>
      {moreHref && (
        <Link
          href={moreHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-market-red transition-colors duration-150 hover:text-market-red-dark"
        >
          {moreLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/**
 * Main-column showcase (design 1): category chip grid, featured products,
 * verified suppliers — all live Supabase data.
 */
export async function MarketShowcase({ locale, sectors }: ShowcaseProps) {
  const t = await getTranslations("MarketHome.showcase");
  const supabase = await createServerSupabaseClient();

  const [productsRes, suppliersRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, name_en, name_fr, description, description_en, description_fr, images, companies!inner(name, verification_tier, status, city, province)",
      )
      .eq("companies.status", "verified")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("companies")
      .select("id, name, logo_url, city, province, verification_tier, sector_id, products(count)")
      .eq("status", "verified")
      .in("verification_tier", [VERIFICATION_TIER.VERIFIED, VERIFICATION_TIER.PREMIUM])
      .order("is_premium", { ascending: false })
      .limit(4),
  ]);

  type ProductRow = {
    id: string;
    name: string;
    name_en: string | null;
    name_fr: string | null;
    description: string | null;
    description_en: string | null;
    description_fr: string | null;
    images: string[] | null;
    companies: { name: string; verification_tier: string | null; city: string | null; province: string | null };
  };
  type SupplierRow = {
    id: string;
    name: string;
    logo_url: string | null;
    city: string | null;
    province: string | null;
    verification_tier: string | null;
    sector_id: string | null;
    products: Array<{ count: number }>;
  };

  const products = (productsRes.data ?? []) as unknown as ProductRow[];
  const suppliers = (suppliersRes.data ?? []) as unknown as SupplierRow[];
  const sectorLabel = new Map(sectors.map((s) => [s.id, s.label]));
  const loc = (row: { city: string | null; province: string | null }) =>
    [row.city, row.province].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Explore by category — 12 design categories linked to live sectors */}
      <section aria-label={t("categoriesTitle")}>
        <SectionHeading title={t("categoriesTitle")} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {DESIGN_CATEGORIES.map(({ key, match, Icon, className }) => {
            const sector = sectors.find((s) => match.test(s.label));
            return (
              <Link
                key={key}
                href={sector ? `/products?sector=${sector.id}` : "/products"}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors duration-150 hover:border-market-navy/30 hover:bg-slate-50"
              >
                <Icon className={`h-5 w-5 shrink-0 ${className}`} strokeWidth={1.75} aria-hidden />
                <span className="text-xs font-semibold leading-tight text-slate-800">{t(`cats.${key}`)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      {products.length > 0 && (
        <section aria-label={t("featuredTitle")}>
          <SectionHeading title={t("featuredTitle")} moreHref="/products" moreLabel={t("viewAllProducts")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {products.map((p, i) => {
              const name = pickLocalized(p, "name", locale as Locale) || p.name;
              const desc = pickLocalized(p, "description", locale as Locale) || p.description;
              const img = p.images?.[0] ?? FALLBACK_PRODUCT_IMAGES[i % FALLBACK_PRODUCT_IMAGES.length];
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[2/1] w-full bg-slate-100">
                    <Image src={img} alt={name} fill className="object-cover" sizes="(min-width: 1280px) 12vw, 40vw" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <div className="text-xs font-bold leading-tight text-market-navy">{name}</div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                      <span className="truncate">{p.companies.name}</span>
                      {isVerifiedTier(p.companies.verification_tier) && (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-label={t("verified")} />
                      )}
                    </div>
                    {loc(p.companies) && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {loc(p.companies)}
                      </div>
                    )}
                    {desc && <p className="line-clamp-2 text-[10px] text-slate-500">{desc}</p>}
                    <div className="mt-auto flex gap-1.5 pt-1.5">
                      <Link
                        href={`/products/${p.id}`}
                        className="flex flex-1 items-center justify-center rounded border border-slate-300 px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                      >
                        {t("viewProduct")}
                      </Link>
                      <Link
                        href="/rfq"
                        className="flex flex-1 items-center justify-center rounded bg-market-red px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-white transition-colors duration-150 hover:bg-market-red-dark"
                      >
                        {t("requestQuote")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Verified suppliers */}
      {suppliers.length > 0 && (
        <section aria-label={t("suppliersTitle")}>
          <SectionHeading title={t("suppliersTitle")} moreHref="/companies" moreLabel={t("viewAllSuppliers")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suppliers.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
                    {c.logo_url ? (
                      <Image src={c.logo_url} alt="" fill className="object-contain" sizes="40px" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs font-bold text-market-navy">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-market-navy">
                      <span className="truncate">{c.name}</span>
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-label={t("verified")} />
                    </div>
                    {c.sector_id && sectorLabel.get(c.sector_id) && (
                      <div className="truncate text-[10px] text-slate-500">{sectorLabel.get(c.sector_id)}</div>
                    )}
                    {loc(c) && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {loc(c)}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">
                      {t("productCount", { count: c.products?.[0]?.count ?? 0 })}
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex gap-1.5">
                  <Link
                    href={`/companies/${c.id}`}
                    className="flex flex-1 items-center justify-center rounded border border-slate-300 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                  >
                    {t("viewSupplier")}
                  </Link>
                  <Link
                    href={`/companies/${c.id}`}
                    className="flex flex-1 items-center justify-center rounded bg-market-red px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-white transition-colors duration-150 hover:bg-market-red-dark"
                  >
                    {t("contactSupplier")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
