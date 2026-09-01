/**
 * Promotion plans offered on /pricing ("Promote Your Business in the DRC
 * Market", customer design 2026-07-28).
 *
 * Prices are the contract: `premium_requests.amount_usd` is pinned to the plan
 * by a CHECK constraint (00023, widened in 00039), so these numbers and that
 * constraint must agree. Confirmed by the customer 2026-07-28.
 */

/** Which audience a plan is sold to — the page's first two tabs. */
export const PROMOTION_AUDIENCES = ["local", "international"] as const;
export type PromotionAudience = (typeof PROMOTION_AUDIENCES)[number];

/** Stored in premium_requests.plan / business_requests.promotion_plan. */
export type PromotionPlanId = "congolese" | "international" | "international_strategic";

export interface PromotionPlan {
  id: PromotionPlanId;
  audience: PromotionAudience;
  /** Yearly price in USD. Mirrored by the DB CHECK constraint. */
  amountUsd: number;
  /** How many feature bullets the i18n catalog supplies for this plan. */
  bullets: number;
  /** Gold accent = the premium/upsell option in its tab. */
  accent: "blue" | "gold";
}

export const PROMOTION_PLANS: readonly PromotionPlan[] = [
  {
    id: "congolese",
    audience: "local",
    amountUsd: 3000,
    bullets: 10,
    accent: "blue",
  },
  {
    id: "international",
    audience: "international",
    amountUsd: 3600,
    bullets: 12,
    accent: "blue",
  },
  {
    id: "international_strategic",
    audience: "international",
    amountUsd: 6000,
    bullets: 12,
    accent: "gold",
  },
] as const;

export function plansForAudience(audience: PromotionAudience): PromotionPlan[] {
  return PROMOTION_PLANS.filter((p) => p.audience === audience);
}

export function findPlan(id: string): PromotionPlan | undefined {
  return PROMOTION_PLANS.find((p) => p.id === id);
}

/** "USD 3,600" — grouped, currency first, as the design writes it. */
export function formatPlanPrice(amountUsd: number): string {
  return `USD ${amountUsd.toLocaleString("en-US")}`;
}

/**
 * Rows of the "Compare Plans" table, comparing the two international tiers.
 * `value` is either a boolean (✓ / —) or an i18n key suffix under
 * `Premium.comparePlans.values`. Order must match `Premium.comparePlans.rows`.
 */
export const COMPARE_ROWS: ReadonlyArray<{
  key: string;
  visibility: boolean | string;
  strategic: boolean | string;
}> = [
  { key: "premiumProfile", visibility: true, strategic: true },
  { key: "verifiedBadge", visibility: true, strategic: true },
  { key: "priorityDirectory", visibility: true, strategic: true },
  { key: "categoryVisibility", visibility: "standard", strategic: "featured" },
  { key: "productsShowcase", visibility: true, strategic: true },
  { key: "leadCapture", visibility: true, strategic: true },
  { key: "opportunitiesPerYear", visibility: "upTo3", strategic: "upTo6" },
  { key: "sponsoredOpportunity", visibility: false, strategic: true },
  { key: "homepageFeature", visibility: false, strategic: true },
  { key: "newsletterVisibility", visibility: "limited", strategic: true },
  { key: "sectorPagePromotion", visibility: "standard", strategic: "priority" },
  { key: "introductionSupport", visibility: "basic", strategic: "advanced" },
  { key: "performanceReport", visibility: "quarterly", strategic: "semiAnnualLeads" },
  { key: "marketEntrySupport", visibility: "basicGuidance", strategic: "priorityGuidance" },
] as const;
