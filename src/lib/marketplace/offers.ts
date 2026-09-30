/**
 * Shared marketplace-offer helpers (listing page + offer detail page).
 *
 * Direction of trade is not stored on products: it follows the selling
 * company's declared `registration_profile`. An international company selling
 * into the DRC is an "import" offer; a Congolese company's offer is "export".
 */

export type Origin = "import" | "export";
export type TierGroup = "full" | "docs";

export interface OfferCompanyFacts {
  registration_profile: string | null;
  country: string | null;
  province: string | null;
  moq: string | null;
  lead_time: string | null;
}

export function isOrigin(value: unknown): value is Origin {
  return value === "import" || value === "export";
}

export function originOf(registrationProfile: string | null): Origin {
  return registrationProfile === "international" ? "import" : "export";
}

/** verified / premium = full vetting; basic = documents checked, still in review. */
export function tierGroup(tier: string | null): TierGroup | null {
  if (tier === "verified" || tier === "premium") return "full";
  if (tier === "basic") return "docs";
  return null;
}

/** Where the offer ships from: a province for Congolese sellers, a country otherwise. */
export function placeOf(c: Pick<OfferCompanyFacts, "registration_profile" | "country" | "province">): string | null {
  return c.registration_profile === "congolese" ? c.province : c.country;
}

export function humanizeKey(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Printable spec entries; nested objects and empty values are skipped. */
export function specEntries(specs: unknown): { label: string; value: string }[] {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];
  return Object.entries(specs as Record<string, unknown>)
    .filter(([, v]) => (typeof v === "string" && v.trim() !== "") || typeof v === "number")
    .map(([k, v]) => ({ label: humanizeKey(k), value: String(v) }));
}

/**
 * The (up to three) facts on an offer card: the seller's MOQ and lead time
 * when filled in, topped up with the product's own specs.
 */
export function cardFacts(
  company: Pick<OfferCompanyFacts, "moq" | "lead_time">,
  specs: unknown,
  labels: { moq: string; leadTime: string },
): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  if (company.moq) facts.push({ label: labels.moq, value: company.moq });
  if (company.lead_time) facts.push({ label: labels.leadTime, value: company.lead_time });
  for (const entry of specEntries(specs)) {
    if (facts.length >= 3) break;
    facts.push(entry);
  }
  return facts;
}

/**
 * Illustrative photo for an offer without its own images, picked from the
 * sector artwork by product-category slug. Real product images always win.
 */
const CATEGORY_VISUALS: { match: RegExp; src: string }[] = [
  { match: /copper|cobalt|gold|coltan|diamond|iron|ore|mineral/, src: "/images/sectors/mining.webp" },
  { match: /coffee|cocoa|palm|cassava|maize|agri/, src: "/images/sectors/agriculture.webp" },
  { match: /hardwood|timber|wood|forest/, src: "/images/sectors/forestry.webp" },
  { match: /cement|steel|construct|material/, src: "/images/sectors/infrastructure.webp" },
  { match: /energ|solar|oil|gas|power/, src: "/images/sectors/energy.webp" },
];

export function offerVisual(images: string[] | null, categorySlug: string | null): {
  src: string;
  illustrative: boolean;
} {
  if (images && images.length > 0) return { src: images[0], illustrative: false };
  const hit = CATEGORY_VISUALS.find((v) => categorySlug && v.match.test(categorySlug));
  return { src: hit?.src ?? "/images/sectors/manufacturing.webp", illustrative: true };
}

/** Two-letter monogram for a supplier without a logo. */
export function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}
