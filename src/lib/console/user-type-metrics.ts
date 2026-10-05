import { createClient } from "@/lib/supabase/client";
import type { OverviewPeriod } from "@/lib/dashboard/overview/metrics";

/**
 * Staff console Statistics: the platform read by type of user, through the
 * `console_user_type_metrics` SECURITY DEFINER function (migration 00067,
 * staff only). Counts only — no e-mail address, no visitor id.
 */

/** An account is typed from what it owns today: staff, a company in the DRC, a company elsewhere, or nothing yet. */
export const ACCOUNT_KINDS = ["congolese", "international", "none", "staff"] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export interface AccountKindStats {
  total: number;
  new_current: number;
  new_previous: number;
  /** Signed in at least once over the period. */
  active: number;
  /** E-mail address confirmed. */
  confirmed: number;
}

export const SEGMENT_KEYS = ["drc", "intl"] as const;
export type SegmentKey = (typeof SEGMENT_KEYS)[number];

export const SEGMENT_FUNNEL_STEPS = ["registered", "submitted", "verified", "listed", "contacted"] as const;
export type SegmentFunnelStep = (typeof SEGMENT_FUNNEL_STEPS)[number];

/** Figures a company segment can be compared on, in display order. */
export const SEGMENT_COMPARE_KEYS = [
  "products_published",
  "opportunities",
  "profile_views",
  "product_views",
  "contact_requests",
  "requests_received",
  "conversations",
  "responses_sent",
] as const;
export type SegmentCompareKey = (typeof SEGMENT_COMPARE_KEYS)[number];

export interface CompanySegment extends Record<SegmentCompareKey, number> {
  companies: number;
  /** Distinct accounts behind those companies. */
  owners: number;
  new_current: number;
  new_previous: number;
  premium: number;
  products: number;
  /** Each step is a subset of the previous one. */
  funnel: Record<SegmentFunnelStep, number>;
}

export interface TeamMember {
  id: string;
  /** Empty when the member has not filled their name. */
  name: string;
  role: "super_admin" | "moderator";
  is_self: boolean;
  decisions: number;
  approved: number;
  forwarded: number;
  last_action_at: string | null;
}

export interface ConsoleUserTypeMetrics {
  period_days: number;
  current_start: string;
  viewer_role: "super_admin" | "moderator";
  accounts: Record<AccountKind, AccountKindStats>;
  /** New accounts per day of the period, staff excluded. */
  signups: { with_company: number[]; without_company: number[] };
  segments: Record<SegmentKey, CompanySegment>;
  moderation: {
    approved: number;
    rejected: number;
    more_info: number;
    median_decision_hours: number | null;
    requests_forwarded: number;
    requests_waiting: number;
  };
  /** Everyone for a super-admin; only the caller for a moderator. */
  team: TeamMember[];
}

export async function fetchConsoleUserTypeMetrics(days: OverviewPeriod): Promise<ConsoleUserTypeMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("console_user_type_metrics", { p_days: days });
  if (error) throw new Error(`console_user_type_metrics failed: ${error.message}`);
  return data as ConsoleUserTypeMetrics;
}
