import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import {
  cardFacts,
  initialsOf,
  offerVisual,
  placeOf,
  tierGroup,
} from "@/lib/marketplace/offers";
import type { OfferCardData } from "./offer-card";

/** Columns every offer card needs (product + category + selling company). */
export const OFFER_CARD_SELECT =
  "id, name, name_en, name_fr, images, specs, created_at, categories(id, slug, name_en, name_fr, sector_id), companies!inner(name, logo_url, verification_tier, registration_profile, country, province, city, moq, lead_time)";

/** A row selected with OFFER_CARD_SELECT (the DB types carry no FK relations). */
export interface OfferCardRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  images: string[] | null;
  specs: Record<string, unknown> | null;
  created_at: string;
  categories: {
    id: string;
    slug: string | null;
    name_en: string | null;
    name_fr: string | null;
    sector_id: string | null;
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

/** Card data for one offer; `labels` are the localized MOQ / lead-time names. */
export function toOfferCardData(
  p: OfferCardRow & { companies: NonNullable<OfferCardRow["companies"]> },
  locale: Locale,
  labels: { moq: string; leadTime: string },
): OfferCardData {
  const c = p.companies;
  return {
    id: p.id,
    name: pickLocalized(p, "name", locale) || p.name,
    category: p.categories ? pickLocalized(p.categories, "name", locale) : null,
    verified: tierGroup(c.verification_tier) === "full",
    supplier: c.name,
    supplierLogo: c.logo_url,
    supplierInitials: initialsOf(c.name),
    location: [c.city, placeOf(c)].filter(Boolean).join(", ") || null,
    visual: offerVisual(p.images, p.categories?.slug ?? null),
    facts: cardFacts(c, p.specs, labels),
  };
}
