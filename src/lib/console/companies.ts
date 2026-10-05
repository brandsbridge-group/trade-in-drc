import type { CompanyStatus, VerificationTier } from "@/constants/status";
import type { ReviewStage } from "@/lib/verifications/workflow";
import { isHomeCountry } from "@/lib/verifications/required-documents";

/**
 * The console's company list (`/console/companies`): what a row holds and the
 * rules its quick views, filters and indicators share. Pure, so the tiles and
 * the table can never disagree on a count.
 */

export interface ConsoleCompanyRow {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  sectorName: string | null;
  status: CompanyStatus;
  /** Whose turn it is — derived from the review trail, never from `status` alone. */
  stage: ReviewStage;
  verificationTier: VerificationTier;
  isPremium: boolean;
  premiumPlan: string | null;
  premiumExpiresAt: string | null;
  productCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

export const COMPANY_VIEWS = ["all", "to_review", "awaiting_owner", "not_submitted", "verified", "rejected"] as const;
export type CompanyView = (typeof COMPANY_VIEWS)[number];

export const COMPANY_ORIGINS = ["drc", "intl"] as const;
export type CompanyOrigin = (typeof COMPANY_ORIGINS)[number];

export const COMPANY_SORTS = ["recent", "name", "products"] as const;
export type CompanySort = (typeof COMPANY_SORTS)[number];

/** Registered in the DRC, or abroad. A company with no country predates the column: the DRC. */
export function companyOrigin(country: string | null): CompanyOrigin {
  return isHomeCountry(country) ? "drc" : "intl";
}

/** Premium counts only while it runs: the flag set, and no end date in the past. */
export function premiumActive(row: Pick<ConsoleCompanyRow, "isPremium" | "premiumExpiresAt">, now: Date): boolean {
  if (!row.isPremium) return false;
  return !row.premiumExpiresAt || new Date(row.premiumExpiresAt).getTime() > now.getTime();
}

export function inCompanyView(row: Pick<ConsoleCompanyRow, "stage">, view: CompanyView): boolean {
  return view === "all" || row.stage === view;
}

export function companyViewCounts(rows: Pick<ConsoleCompanyRow, "stage">[]): Record<CompanyView, number> {
  const counts = Object.fromEntries(COMPANY_VIEWS.map((view) => [view, 0])) as Record<CompanyView, number>;
  for (const row of rows) {
    counts.all += 1;
    counts[row.stage] += 1;
  }
  return counts;
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export interface CompanyFilters {
  view: CompanyView;
  query: string;
  /** Sector name as shown, or null for every sector. */
  sector: string | null;
  origin: CompanyOrigin | null;
  premiumOnly: boolean;
}

export const NO_COMPANY_FILTERS: CompanyFilters = { view: "all", query: "", sector: null, origin: null, premiumOnly: false };

/** Search reads the name, the place, the sector and the owner; case and accents ignored. */
export function filterCompanies(rows: ConsoleCompanyRow[], filters: CompanyFilters, now: Date): ConsoleCompanyRow[] {
  const q = fold(filters.query.trim());
  return rows.filter((row) => {
    if (!inCompanyView(row, filters.view)) return false;
    if (filters.sector && row.sectorName !== filters.sector) return false;
    if (filters.origin && companyOrigin(row.country) !== filters.origin) return false;
    if (filters.premiumOnly && !premiumActive(row, now)) return false;
    if (!q) return true;
    const haystack = [row.name, row.city, row.country, row.sectorName, row.ownerName, row.ownerEmail].filter(Boolean).join(" ");
    return fold(haystack).includes(q);
  });
}

export function sortCompanies(rows: ConsoleCompanyRow[], sort: CompanySort, locale: string): ConsoleCompanyRow[] {
  const sorted = [...rows];
  if (sort === "name") return sorted.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
  if (sort === "products") return sorted.sort((a, b) => b.productCount - a.productCount || b.createdAt.localeCompare(a.createdAt));
  return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Two letters standing in for a missing logo: "Kivu Coffee Cooperative" → "KC". */
export function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export interface CompanySummary {
  total: number;
  toReview: number;
  verified: number;
  /** Verified companies out of all, as a whole percentage. */
  verifiedRate: number;
  premium: number;
  drc: number;
  intl: number;
}

export function summarizeCompanies(rows: ConsoleCompanyRow[], now: Date): CompanySummary {
  const counts = companyViewCounts(rows);
  const intl = rows.filter((row) => companyOrigin(row.country) === "intl").length;
  return {
    total: rows.length,
    toReview: counts.to_review,
    verified: counts.verified,
    verifiedRate: rows.length === 0 ? 0 : Math.round((counts.verified / rows.length) * 100),
    premium: rows.filter((row) => premiumActive(row, now)).length,
    drc: rows.length - intl,
    intl,
  };
}
