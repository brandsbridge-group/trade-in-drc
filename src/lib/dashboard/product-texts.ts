/** The two languages a product is written in from the dashboard. */
export const PRODUCT_LANGS = ["fr", "en"] as const;
export type ProductLang = (typeof PRODUCT_LANGS)[number];

export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;

export interface ProductTexts {
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
}

export type ProductTextError = "name" | "description";

export type ResolvedProductTexts =
  | { ok: true; texts: ProductTexts }
  | { ok: false; errors: ProductTextError[] };

/**
 * A product needs a name and a description in at least ONE language; the other
 * is optional. A missing translation is filled with the text that exists, so
 * the public page never shows an empty title to a visitor browsing in the
 * other language — the owner can refine the translation later.
 */
export function resolveProductTexts(input: ProductTexts): ResolvedProductTexts {
  const clean = (value: string) => value.trim();
  const nameFr = clean(input.name_fr);
  const nameEn = clean(input.name_en);
  const descriptionFr = clean(input.description_fr);
  const descriptionEn = clean(input.description_en);

  const errors: ProductTextError[] = [];
  if (Math.max(nameFr.length, nameEn.length) < NAME_MIN) errors.push("name");
  if (Math.max(descriptionFr.length, descriptionEn.length) < DESCRIPTION_MIN) errors.push("description");
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    texts: {
      name_fr: nameFr || nameEn,
      name_en: nameEn || nameFr,
      description_fr: descriptionFr || descriptionEn,
      description_en: descriptionEn || descriptionFr,
    },
  };
}

/** True when that language has both its own name and its own description. */
export function isLangComplete(texts: ProductTexts, lang: ProductLang): boolean {
  return texts[`name_${lang}`].trim().length >= NAME_MIN && texts[`description_${lang}`].trim().length >= DESCRIPTION_MIN;
}
