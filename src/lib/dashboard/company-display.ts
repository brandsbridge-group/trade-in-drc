import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { COMPANY_STATUS } from "@/constants/status";

/**
 * A `sectors(name_en, name_fr)` embed from Supabase. PostgREST returns a
 * single object for a many-to-one FK (companies.sector_id -> sectors.id),
 * but can shape it as a one-element array depending on the query — normalize
 * both here rather than trusting the inferred shape (see
 * src/components/layout/featured-companies.tsx for the same defensive cast).
 */
type SectorEmbed =
  | { name_en: string | null; name_fr: string | null }
  | { name_en: string | null; name_fr: string | null }[]
  | null
  | undefined;

/**
 * P1-7: resolve a company's sector label from the `sectors` embed instead of
 * the phantom `company.sector` field that was never selected from the DB.
 * Returns "" when the company has no sector_id set, so callers can decide
 * whether to hide the line entirely.
 */
export function resolveSectorLabel(sectors: SectorEmbed, locale: Locale): string {
  const sector = Array.isArray(sectors) ? sectors[0] : sectors;
  if (!sector) return "";
  return pickLocalized(sector, "name", locale);
}

/**
 * P1-3: `companies_public` (00036) only exposes `status = 'verified'` rows —
 * that predicate is intentionally not relaxed, since the view is granted to
 * `anon` and widening it would leak unverified companies site-wide. An owner
 * viewing their own pending/rejected company must instead see a disabled
 * "visible once verified" state on the dashboard rather than a 404.
 */
export function canViewPublicProfile(status: string): boolean {
  return status === COMPANY_STATUS.VERIFIED;
}

/**
 * P1-1: the dashboard header CTA reused `registerFirst` unconditionally, so an
 * owner who already has companies was told to "Register Your First Company"
 * again. `registerFirstOrAnother` picks the right copy key based on whether
 * the owner already owns at least one company. Callers must gate rendering on
 * `isLoading` themselves so the label does not flip right after hydration
 * (before the companies query resolves).
 */
export function registerFirstOrAnother(companyCount: number): "registerFirst" | "registerAnother" {
  return companyCount > 0 ? "registerAnother" : "registerFirst";
}
