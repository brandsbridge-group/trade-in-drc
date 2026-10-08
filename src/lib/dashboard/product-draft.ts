/**
 * Unsaved edits of the product editor, kept in this browser (see
 * `src/lib/drafts/local-draft.ts`) so a reload, a closed tab or a page error
 * never costs the seller what they typed. Photos are not part of it: a file
 * picked from the disk cannot be stored.
 */
import { MAX_SPECS, humanizeSpecKey, type CustomSpec, type SpecField, type TemplateValues } from "@/lib/products/specs";

/** The editor's text inputs, flat, as `changedFields` / `applyDraft` expect them. */
export interface ProductDraftFields {
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  categoryId: string;
  price: string;
  currency: string;
  unit: string;
  minOrder: string;
}

/** Characteristics as the form holds them: template values and free lines. */
export interface ProductDraftSpecs {
  values: TemplateValues;
  custom: CustomSpec[];
}

export interface ProductDraft {
  /** Only the fields that differ from the stored product. */
  fields?: Partial<ProductDraftFields>;
  /** Present once the seller has touched the characteristics. */
  specs?: ProductDraftSpecs;
}

/** One draft per product; a product not created yet has one per company. */
export const productDraftKey = (companyId: string, productId?: string) =>
  `tidrc:product:draft:v1:${productId ?? `new:${companyId}`}`;

/** Nothing typed: no template value and no free line with a name or a value. */
export function isEmptySpecs(specs: ProductDraftSpecs): boolean {
  return (
    Object.values(specs.values).every((value) => !value.trim()) &&
    specs.custom.every((row) => !row.label.trim() && !row.value.trim())
  );
}

/**
 * Reads the characteristics of a stored draft. Storage is not trusted: only
 * strings are kept, free lines get fresh ids, and `null` comes back when
 * nothing usable is left.
 */
export function parseDraftSpecs(raw: unknown): ProductDraftSpecs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as { values?: unknown; custom?: unknown };

  const values: TemplateValues = {};
  if (source.values && typeof source.values === "object" && !Array.isArray(source.values)) {
    for (const [key, value] of Object.entries(source.values as Record<string, unknown>)) {
      if (typeof value === "string") values[key] = value;
    }
  }

  const custom: CustomSpec[] = [];
  if (Array.isArray(source.custom)) {
    for (const row of source.custom.slice(0, MAX_SPECS)) {
      if (!row || typeof row !== "object") continue;
      const { label, value } = row as { label?: unknown; value?: unknown };
      if (typeof label !== "string" || typeof value !== "string") continue;
      custom.push({ id: `draft-${custom.length}`, label, value });
    }
  }

  const specs = { values, custom };
  return isEmptySpecs(specs) ? null : specs;
}

/**
 * Lays a draft's characteristics over the category's current template. A value
 * whose field left the template since becomes a free line, so nothing the
 * seller typed is dropped.
 */
export function restoreDraftSpecs(draft: ProductDraftSpecs, fields: SpecField[]): ProductDraftSpecs {
  const keys = new Set(fields.map((field) => field.key));
  const values: TemplateValues = {};
  const orphans: CustomSpec[] = [];
  for (const [key, value] of Object.entries(draft.values)) {
    if (keys.has(key)) values[key] = value;
    else if (value.trim()) orphans.push({ id: `draft-moved-${key}`, label: humanizeSpecKey(key), value });
  }
  return { values, custom: [...orphans, ...draft.custom] };
}
