/**
 * Profile-completeness score for the dashboard's "À faire" block.
 *
 * Each criterion is something a buyer looks at before contacting a company.
 * The order of CRITERIA is also the order in which missing items are suggested,
 * most persuasive first.
 */

export type CompletenessKey =
  | "logo"
  | "description"
  | "contact"
  | "location"
  | "website"
  | "photos"
  | "certifications"
  | "markets"
  | "products";

export interface CompletenessInput {
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  website: string | null;
  certifications: string[] | null;
  markets: string[] | null;
  photoCount: number;
  productCount: number;
}

/** A description shorter than this reads as a placeholder, not a pitch. */
export const MIN_DESCRIPTION_LENGTH = 80;
/** Photos needed for the gallery to feel real. */
export const MIN_PHOTOS = 2;

const CRITERIA: { key: CompletenessKey; met: (c: CompletenessInput) => boolean }[] = [
  { key: "logo", met: (c) => !!c.logo_url },
  { key: "description", met: (c) => (c.description?.trim().length ?? 0) >= MIN_DESCRIPTION_LENGTH },
  { key: "products", met: (c) => c.productCount > 0 },
  { key: "photos", met: (c) => c.photoCount >= MIN_PHOTOS },
  { key: "contact", met: (c) => !!c.contact_email && !!c.contact_phone },
  { key: "certifications", met: (c) => (c.certifications?.length ?? 0) > 0 },
  { key: "markets", met: (c) => (c.markets?.length ?? 0) > 0 },
  { key: "location", met: (c) => !!c.city?.trim() },
  { key: "website", met: (c) => !!c.website?.trim() },
];

export interface CompletenessResult {
  /** 0–100, rounded. */
  percent: number;
  /** Unmet criteria, most important first. */
  missing: CompletenessKey[];
}

export function profileCompleteness(input: CompletenessInput): CompletenessResult {
  const missing = CRITERIA.filter((c) => !c.met(input)).map((c) => c.key);
  const percent = Math.round(((CRITERIA.length - missing.length) / CRITERIA.length) * 100);
  return { percent, missing };
}

/** Sections of the company editor (`/dashboard/companies/[id]/edit#section`). */
export const EDITOR_SECTIONS = ["presentation", "commerce", "contact", "media"] as const;
export type EditorSection = (typeof EDITOR_SECTIONS)[number];

/** Where each criterion is filled in; `null` = not in the editor (a product is added on its own page). */
export const COMPLETENESS_SECTION: Record<CompletenessKey, EditorSection | null> = {
  logo: "media",
  photos: "media",
  description: "presentation",
  location: "presentation",
  website: "presentation",
  contact: "contact",
  certifications: "commerce",
  markets: "commerce",
  products: null,
};

/** Link that takes the owner straight to the place where a missing item is filled in. */
export function completenessHref(companyId: string, key: CompletenessKey | undefined): string {
  if (key === "products") return "/dashboard/products/new";
  const section = key ? COMPLETENESS_SECTION[key] : null;
  return `/dashboard/companies/${companyId}/edit${section ? `#${section}` : ""}`;
}
