import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import {
  cardFacts,
  initialsOf,
  offerVisual,
  placeOf,
  tierGroup,
} from "@/lib/marketplace/offers";
import { pricingOf } from "@/lib/products/pricing";
import type { OfferCardData } from "./offer-card";

/** Columns every offer card needs (product + category + selling company). */
export const OFFER_CARD_SELECT =
  "id, name, name_en, name_fr, description, description_en, description_fr, images, specs, price, price_currency, sale_unit, min_order_quantity, created_at, categories(id, slug, name_en, name_fr, sector_id, category_spec_fields(key, label_en, label_fr, field_type, unit, options, required, sort_order)), companies!inner(name, logo_url, verification_tier, registration_profile, country, province, city, moq, lead_time)";

/** A row selected with OFFER_CARD_SELECT (the DB types carry no FK relations). */
export interface OfferCardRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  images: string[] | null;
  specs: Record<string, unknown> | null;
  /** Price and minimum order (00064); PostgREST may send a numeric as a string. */
  price: number | string | null;
  price_currency: string | null;
  sale_unit: string | null;
  min_order_quantity: number | string | null;
  created_at: string;
  categories: {
    id: string;
    slug: string | null;
    name_en: string | null;
    name_fr: string | null;
    sector_id: string | null;
    /** The category's specification template (00055). */
    category_spec_fields?: unknown;
  } | null;
  companies: {
    name: string;
    logo_url: string | null;
    verification_tier: string | null;
    registration_profile: string | null;
    country: string | null;
    province: string | null;
    city: string | null;
    moq: string | null;
    lead_time: string | null;
  } | null;
}

/** The seller's description as one short paragraph (the card clamps it to two lines). */
export function offerExcerpt(description: string | null | undefined): string | null {
  const text = (description ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

/** Card data for one offer; `labels` are the localized MOQ / lead-time names. */
export function toOfferCardData(
  p: OfferCardRow & { companies: NonNullable<OfferCardRow["companies"]> },
  locale: Locale,
  labels: { moq: string; leadTime: string; yes?: string; no?: string },
): OfferCardData {
  const c = p.companies;
  const pricing = pricingOf(p);
  return {
    id: p.id,
    name: pickLocalized(p, "name", locale) || p.name,
    excerpt: offerExcerpt(pickLocalized(p, "description", locale) || p.description),
    photoCount: p.images?.length ?? 0,
    category: p.categories ? pickLocalized(p.categories, "name", locale) : null,
    verified: tierGroup(c.verification_tier) === "full",
    supplier: c.name,
    supplierLogo: c.logo_url,
    supplierInitials: initialsOf(c.name),
    location: [c.city, placeOf(c)].filter(Boolean).join(", ") || null,
    visual: offerVisual(p.images, p.categories?.slug ?? null),
    pricing,
    // The product's own minimum order replaces the company-wide one.
    facts: cardFacts(pricing.min_order_quantity !== null ? { ...c, moq: null } : c, p.specs, labels, { fields: p.categories?.category_spec_fields, locale }),
  };
}
