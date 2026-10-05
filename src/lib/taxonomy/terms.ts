/**
 * The taxonomy as the staff console manages it (`/console/taxonomy`): sectors,
 * their categories, HS codes and tags. Pure helpers shared by the screen and
 * its server actions — what a valid entry is, what blocks a deletion, what
 * still lacks a translation. The same rules are enforced in the database
 * (migration 00066); this module only explains them to the person.
 */

export const TAXONOMY_KINDS = ["sectors", "categories", "hs_codes", "tags"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

/** English and French are required everywhere; the other three are optional. */
export const REQUIRED_LOCALES = ["en", "fr"] as const;
export const OPTIONAL_LOCALES = ["es", "tr", "zh"] as const;
export const TERM_LOCALES = [...REQUIRED_LOCALES, ...OPTIONAL_LOCALES] as const;
export type TermLocale = (typeof TERM_LOCALES)[number];

export const NAME_MAX = 80;
export const SLUG_MAX = 60;

export interface TermNames {
  name_en: string;
  name_fr: string;
  name_es: string | null;
  name_tr: string | null;
  name_zh: string | null;
}

export interface SectorUsage {
  categories: number;
  companies: number;
  opportunities: number;
  content: number;
  reports: number;
  prices: number;
  hs_codes: number;
  sub_sectors: number;
}

export interface CategoryUsage {
  products: number;
  services: number;
  /** Its own specification template: deleted with the category, never a blocker. */
  spec_fields: number;
}

export interface HsCodeUsage {
  companies: number;
  sub_codes: number;
}

export interface TagUsage {
  companies: number;
}

export interface SectorTerm extends TermNames {
  id: string;
  slug: string;
  sort_order: number;
  usage: SectorUsage;
}

export interface CategoryTerm extends TermNames {
  id: string;
  slug: string;
  sort_order: number;
  sector_id: string;
  usage: CategoryUsage;
}

export interface HsCodeTerm extends TermNames {
  id: string;
  code: string;
  parent_code: string | null;
  sector_id: string | null;
  usage: HsCodeUsage;
}

export interface TagTerm extends TermNames {
  id: string;
  slug: string;
  usage: TagUsage;
}

export type AnyTerm = SectorTerm | CategoryTerm | HsCodeTerm | TagTerm;

/** A row of `audit_log` written by the taxonomy triggers. */
export interface TaxonomyChange {
  id: string;
  /** `taxonomy.<table>.<insert|update|delete>` */
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  metadata: {
    identifier?: string;
    category_id?: string;
    sector_id?: string;
    changes?: Record<string, { from: unknown; to: unknown }>;
  } | null;
  created_at: string;
  actor_name: string | null;
}

export interface TaxonomyOverview {
  /** Deleting is a super-admin act (RLS, 00066). */
  can_delete: boolean;
  companies_without_sector: number;
  sectors: SectorTerm[];
  categories: CategoryTerm[];
  hs_codes: HsCodeTerm[];
  tags: TagTerm[];
  history: TaxonomyChange[];
}

/** What the form of an entry holds; every kind uses the subset it needs. */
export interface TermValues {
  name_en: string;
  name_fr: string;
  name_es: string;
  name_tr: string;
  name_zh: string;
  /** Only read when creating: frozen afterwards. */
  slug: string;
  /** Only read when creating: frozen afterwards. */
  code: string;
  parent_code: string;
  sector_id: string;
}

export const EMPTY_TERM: TermValues = {
  name_en: "",
  name_fr: "",
  name_es: "",
  name_tr: "",
  name_zh: "",
  slug: "",
  code: "",
  parent_code: "",
  sector_id: "",
};

export type TermField = keyof TermValues;
export type TermError = "required" | "too_long" | "invalid";

/** "Food & Beverages" → "food-beverages"; accents folded, never a double dash. */
export function slugifyTerm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

/** An HS code: 2 to 10 digits, optionally grouped by dots ("09", "0901", "0901.21"). */
export function isHsCode(code: string): boolean {
  if (!/^\d(?:[\d.]*\d)?$/.test(code) || code.includes("..")) return false;
  const digits = code.replace(/\./g, "").length;
  return digits >= 2 && digits <= 10;
}

/** The name in the reader's language, falling back to English. */
export function termName(term: TermNames, locale: string): string {
  const value = (term as unknown as Record<string, string | null>)[`name_${locale}`];
  return (typeof value === "string" && value.trim()) || term.name_en;
}

/** The optional languages this entry has no name in. */
export function missingLocales(term: TermNames): (typeof OPTIONAL_LOCALES)[number][] {
  return OPTIONAL_LOCALES.filter((locale) => !term[`name_${locale}`]?.trim());
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Search across every language, the slug and the code; case and accents ignored. */
export function matchesTerm(term: AnyTerm, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const haystack = [
    term.name_en,
    term.name_fr,
    term.name_es,
    term.name_tr,
    term.name_zh,
    "slug" in term ? term.slug : null,
    "code" in term ? term.code : null,
  ]
    .filter(Boolean)
    .join(" ");
  return fold(haystack).includes(q);
}

export interface Blocker {
  /** Usage key, translated by the screen (`Taxonomy.usage.<key>`). */
  key: string;
  count: number;
}

const BLOCKING_KEYS: Record<TaxonomyKind, readonly string[]> = {
  sectors: ["categories", "companies", "opportunities", "content", "reports", "prices", "hs_codes", "sub_sectors"],
  categories: ["products", "services"],
  hs_codes: ["companies", "sub_codes"],
  tags: ["companies"],
};

/** What still uses this entry, hence why it cannot be deleted. Empty = deletable. */
export function deletionBlockers(kind: TaxonomyKind, usage: object): Blocker[] {
  const counts = usage as Record<string, number>;
  return BLOCKING_KEYS[kind]
    .map((key) => ({ key, count: Number(counts[key]) || 0 }))
    .filter((blocker) => blocker.count > 0);
}

/**
 * Field errors of an entry. `creating` decides whether the identifier (slug or
 * HS code) is checked: once created it is frozen and no longer sent.
 */
export function validateTerm(
  kind: TaxonomyKind,
  values: TermValues,
  creating: boolean
): Partial<Record<TermField, TermError>> {
  const errors: Partial<Record<TermField, TermError>> = {};

  for (const locale of REQUIRED_LOCALES) {
    if (!values[`name_${locale}`].trim()) errors[`name_${locale}`] = "required";
  }
  for (const locale of TERM_LOCALES) {
    if (values[`name_${locale}`].trim().length > NAME_MAX) errors[`name_${locale}`] = "too_long";
  }

  if (kind === "categories" && !values.sector_id) errors.sector_id = "required";

  if (kind === "hs_codes") {
    if (creating) {
      if (!values.code.trim()) errors.code = "required";
      else if (!isHsCode(values.code.trim())) errors.code = "invalid";
    }
    const parent = values.parent_code.trim();
    if (parent && (!isHsCode(parent) || parent === values.code.trim())) errors.parent_code = "invalid";
  } else if (creating) {
    // An empty slug is derived from the English name; a typed one must survive slugifying.
    const slug = slugifyTerm(values.slug.trim() || values.name_en);
    if (!slug && !errors.name_en) errors.slug = "invalid";
  }

  return errors;
}

/** The ids in their new order after moving one entry up (-1) or down (+1); null if it cannot move. */
export function moveTerm(ids: string[], id: string, direction: -1 | 1): string[] | null {
  const index = ids.indexOf(id);
  const other = index + direction;
  if (index < 0 || other < 0 || other >= ids.length) return null;
  const next = [...ids];
  [next[index], next[other]] = [next[other], next[index]];
  return next;
}

export interface TaxonomySummary {
  sectors: number;
  categories: number;
  /** Entries (sectors, categories, HS codes, tags) lacking at least one language. */
  untranslated: number;
  /** Sectors whose companies cannot classify a product yet. */
  sectorsWithoutCategory: number;
  companiesWithoutSector: number;
}

export function summarize(overview: TaxonomyOverview): TaxonomySummary {
  const all: TermNames[] = [...overview.sectors, ...overview.categories, ...overview.hs_codes, ...overview.tags];
  return {
    sectors: overview.sectors.length,
    categories: overview.categories.length,
    untranslated: all.filter((term) => missingLocales(term).length > 0).length,
    sectorsWithoutCategory: overview.sectors.filter((s) => s.usage.categories === 0).length,
    companiesWithoutSector: overview.companies_without_sector,
  };
}

/** `taxonomy.categories.update` → { table: "categories", verb: "update" }; null for anything else. */
export function parseChangeAction(action: string): { table: string; verb: "insert" | "update" | "delete" } | null {
  const match = /^taxonomy\.([a-z_]+)\.(insert|update|delete)$/.exec(action);
  return match ? { table: match[1], verb: match[2] as "insert" | "update" | "delete" } : null;
}
