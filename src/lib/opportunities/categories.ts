export const OPPORTUNITY_CATEGORIES = [
  "tender",
  "ppp",
  "investment_call",
  "offer",
  "demand",
  "quotation",
  "partner_search",
  "project_launch",
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export function isOpportunityCategory(
  value: unknown
): value is OpportunityCategory {
  return (
    typeof value === "string" &&
    (OPPORTUNITY_CATEGORIES as readonly string[]).includes(value)
  );
}
