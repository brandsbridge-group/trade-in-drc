import { createClient } from "@/lib/supabase/client";

/**
 * Company-dashboard aggregates, read through the `owner_dashboard_metrics`
 * SECURITY DEFINER function (migration 00052). Owners cannot SELECT
 * analytics_events directly (admin-only RLS), so this is the only path that
 * returns their real numbers — counts and daily series, never raw events.
 */

export const OVERVIEW_PERIODS = [7, 30, 90] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];

export type MetricKey =
  | "profile_views"
  | "product_views"
  | "search_appearances"
  | "contact_requests"
  | "responses_received";

export interface MetricSeries {
  current: number;
  previous: number;
  /** One count per calendar day of the current period, oldest first. */
  series: number[];
}

export interface TopProduct {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  image: string | null;
  views: number;
}

export interface SearchEntry {
  entity_type: "company" | "product";
  entity_id: string;
  name_en: string | null;
  name_fr: string | null;
  appearances: number;
}

export interface OwnerDashboardMetrics {
  period_days: number;
  current_start: string;
  previous_start: string;
  metrics: Record<MetricKey, MetricSeries>;
  outreach: { started: number; replied: number; median_reply_hours: number | null };
  top_products: TopProduct[];
  top_search: SearchEntry[];
}

export async function fetchOwnerDashboardMetrics(
  days: OverviewPeriod
): Promise<OwnerDashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("owner_dashboard_metrics", { p_days: days });
  if (error) throw new Error(`owner_dashboard_metrics failed: ${error.message}`);
  return data as OwnerDashboardMetrics;
}

export type TrendDirection = "up" | "down" | "flat" | "new";

export interface Trend {
  direction: TrendDirection;
  /** Whole-number percentage change; null when there is no previous baseline. */
  pct: number | null;
}

/** Period-over-period change of a counted metric. */
export function trendOf(current: number, previous: number): Trend {
  if (previous === 0) {
    return current === 0 ? { direction: "flat", pct: 0 } : { direction: "new", pct: null };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { direction: "flat", pct: 0 };
  return { direction: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

/** Contact requests per profile view, as a percentage with one decimal; null without views. */
export function ratePct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Change of a rate between two periods, in percentage points (one decimal). */
export function ratePointsDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 10) / 10;
}
