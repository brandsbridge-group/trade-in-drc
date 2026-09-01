import type { Locale } from "@/config/locales";

/**
 * Locale fallback order for DB-backed content. When a row has no value for the
 * active locale (e.g. an untranslated TR/ZH/ES field after migration 00027), we
 * fall back to French, then English, so the UI never renders an empty string or
 * silently mislabels English as another language.
 */
export const CONTENT_FALLBACK_ORDER: readonly Locale[] = ["en", "fr"] as const;

/**
 * Pick a localized value from a row that stores parallel `<base>_<locale>`
 * columns (e.g. `title_en`, `title_fr`, `title_tr`, ...).
 *
 * Resolution: active locale → French → English → "". This is the canonical
 * replacement for the ad-hoc `locale === "fr" ? x_fr : x_en` pattern, which
 * silently showed English for any non-FR locale.
 *
 * @param row       any object holding `<base>_<locale>` string columns
 * @param baseField the column prefix, e.g. "title" or "description"
 * @param locale    the active request locale
 */
export function pickLocalized<T extends object>(
  row: T | null | undefined,
  baseField: string,
  locale: Locale
): string {
  if (!row) return "";
  const record = row as Record<string, unknown>;

  const candidates: Locale[] = [
    locale,
    ...CONTENT_FALLBACK_ORDER.filter((l) => l !== locale),
  ];

  for (const candidate of candidates) {
    const value = record[`${baseField}_${candidate}`];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}
