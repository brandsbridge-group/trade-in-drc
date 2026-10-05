import { createClient } from "@/lib/supabase/client";
import { COMPANY_STATUS } from "@/constants/status";

/** A product as the owner's pages read it (`products` row + its category). */
export interface OwnerProduct {
  id: string;
  company_id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  category_id: string | null;
  images: string[] | null;
  specs: unknown;
  /** Price of one `sale_unit` and smallest order (00064); both optional. */
  price: number | null;
  price_currency: "USD" | "EUR" | "CDF";
  sale_unit: string | null;
  min_order_quantity: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  categories: { id: string; name_en: string; name_fr: string } | null;
}

export const OWNER_PRODUCT_SELECT = "*, categories(id, name_en, name_fr)";

export interface ProductMetric {
  views: number;
  previous_views: number;
  search_appearances: number;
  /** Daily views over the period, oldest first. */
  series: number[];
}

export interface OwnerProductMetrics {
  period_days: number;
  current_start: string;
  products: Record<string, ProductMetric>;
}

export const PRODUCT_METRICS_DAYS = 30;

/** Views per product: owners cannot read `analytics_events`, so this goes through the 00057 aggregate. */
export async function fetchOwnerProductMetrics(days: number = PRODUCT_METRICS_DAYS): Promise<OwnerProductMetrics> {
  const { data, error } = await createClient().rpc("owner_product_metrics", { p_days: days });
  if (error) throw new Error(`owner_product_metrics failed: ${error.message}`);
  return data as OwnerProductMetrics;
}

export function localizedName(product: Pick<OwnerProduct, "name" | "name_en" | "name_fr">, locale: string): string {
  return (locale === "fr" ? product.name_fr : product.name_en) || product.name_en || product.name_fr || product.name;
}

export function localizedDescription(
  product: Pick<OwnerProduct, "description" | "description_en" | "description_fr">,
  locale: string
): string {
  return (
    (locale === "fr" ? product.description_fr : product.description_en) ||
    product.description_en ||
    product.description_fr ||
    product.description ||
    ""
  );
}

/**
 * What a buyer can see of a product:
 * - `hidden`: the seller switched it off;
 * - `awaiting`: published, but the company is not verified yet (RLS keeps it private);
 * - `live`: in the marketplace.
 */
export type ProductVisibility = "live" | "awaiting" | "hidden";

export function productVisibility(product: Pick<OwnerProduct, "is_published">, companyStatus: string | undefined): ProductVisibility {
  if (!product.is_published) return "hidden";
  return companyStatus === COMPANY_STATUS.VERIFIED ? "live" : "awaiting";
}

export const QUALITY_KEYS = ["photo", "gallery", "description", "category", "specs"] as const;
export type QualityKey = (typeof QUALITY_KEYS)[number];

/** A listing with fewer photos than this looks thin next to its neighbours. */
export const MIN_GALLERY = 3;
/** A description shorter than this reads as a title, not a pitch. */
export const MIN_PRODUCT_DESCRIPTION = 150;
/** Characteristics needed for the spec table to be worth a look. */
export const MIN_SPECS = 3;

export interface ProductQuality {
  /** 0–100, rounded. */
  percent: number;
  missing: QualityKey[];
}

/** How complete a listing is, on the things a buyer looks at before asking for a quote. */
export function productQuality(product: Pick<OwnerProduct, "images" | "description" | "description_en" | "description_fr" | "category_id" | "specs">): ProductQuality {
  const photos = product.images?.length ?? 0;
  const description = Math.max(
    product.description_fr?.trim().length ?? 0,
    product.description_en?.trim().length ?? 0,
    product.description?.trim().length ?? 0
  );
  const specs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? Object.values(product.specs as Record<string, unknown>).filter((v) => v !== null && v !== "").length
      : 0;

  const met: Record<QualityKey, boolean> = {
    photo: photos >= 1,
    gallery: photos >= MIN_GALLERY,
    description: description >= MIN_PRODUCT_DESCRIPTION,
    category: !!product.category_id,
    specs: specs >= MIN_SPECS,
  };
  const missing = QUALITY_KEYS.filter((key) => !met[key]);
  return { percent: Math.round(((QUALITY_KEYS.length - missing.length) / QUALITY_KEYS.length) * 100), missing };
}

export const PRODUCT_SORTS = ["recent", "name", "views", "quality"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
export type VisibilityFilter = "all" | ProductVisibility;

export interface ProductFilters {
  search: string;
  categoryId: string;
  visibility: VisibilityFilter;
  sort: ProductSort;
}

/** The list as the toolbar asks for it. Search matches the name in either language. */
export function filterProducts(
  products: OwnerProduct[],
  filters: ProductFilters,
  context: { locale: string; companyStatus: string | undefined; metrics?: Record<string, ProductMetric> }
): OwnerProduct[] {
  const needle = filters.search.trim().toLowerCase();
  const views = (p: OwnerProduct) => context.metrics?.[p.id]?.views ?? 0;

  const kept = products.filter((p) => {
    if (needle && ![p.name, p.name_en, p.name_fr].some((n) => n?.toLowerCase().includes(needle))) return false;
    if (filters.categoryId && p.category_id !== filters.categoryId) return false;
    if (filters.visibility !== "all" && productVisibility(p, context.companyStatus) !== filters.visibility) return false;
    return true;
  });

  return [...kept].sort((a, b) => {
    switch (filters.sort) {
      case "name":
        return localizedName(a, context.locale).localeCompare(localizedName(b, context.locale), context.locale);
      case "views":
        return views(b) - views(a) || b.created_at.localeCompare(a.created_at);
      case "quality":
        // Weakest listings first: this sort answers "what should I improve?".
        return productQuality(a).percent - productQuality(b).percent || b.created_at.localeCompare(a.created_at);
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
}
