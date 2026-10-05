import { createClient } from "@/lib/supabase/client";
import type { OverviewPeriod } from "@/lib/dashboard/overview/metrics";

/**
 * Company Statistics page: what the home aggregate (`owner_dashboard_metrics`)
 * does not carry. Read through `owner_analytics_details` (migration 00067,
 * SECURITY DEFINER, scoped to the caller's own companies) — owners cannot read
 * analytics_events, conversations of others or business_requests directly.
 */
export interface OwnerAnalyticsDetails {
  period_days: number;
  current_start: string;
  companies_count: number;
  /** Distinct visitors behind the profile and product views. */
  audience: { visitors: number; visitors_previous: number; repeat_visitors: number };
  /** Conversations buyers opened with the owner's companies, and the owner's answers. */
  inbound: { received: number; replied: number; median_reply_hours: number | null };
  /** Buyer requests the team forwarded. */
  requests: { current: number; previous: number; total: number; unopened: number; on_product: number };
  catalogue: { products: number; published: number; priced: number; with_photo: number; viewed: number };
  opportunities: {
    published: number;
    pending: number;
    /** Replies received on the owner's opportunities over the period. */
    responses: number;
    /** Replies the owner sent to other companies' opportunities over the period. */
    sent: number;
    top: {
      id: string;
      slug: string;
      category: string;
      title_en: string | null;
      title_fr: string | null;
      status: string;
      responses: number;
    }[];
  };
  by_company: {
    id: string;
    name: string;
    status: string;
    profile_views: number;
    product_views: number;
    contacts: number;
  }[];
}

export async function fetchOwnerAnalyticsDetails(days: OverviewPeriod): Promise<OwnerAnalyticsDetails> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("owner_analytics_details", { p_days: days });
  if (error) throw new Error(`owner_analytics_details failed: ${error.message}`);
  return data as OwnerAnalyticsDetails;
}

const DAY_MS = 86_400_000;

/**
 * Folds a daily series into the seven days of the week, Monday first.
 * `startDate` is the UTC day of the first value, as the aggregates return it.
 */
export function weekdayTotals(series: number[], startDate: string): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const start = new Date(startDate).getTime();
  series.forEach((value, i) => {
    const day = new Date(start + i * DAY_MS).getUTCDay(); // 0 = Sunday
    totals[(day + 6) % 7] += value;
  });
  return totals;
}

export interface FunnelStep<K extends string = string> {
  key: K;
  value: number;
  /** Share of the previous step, 0..1; null on the first step or when the previous step is empty. */
  ofPrevious: number | null;
}

/** Turns ordered counts into funnel steps, each with its share of the step before. */
export function funnelSteps<K extends string>(steps: { key: K; value: number }[]): FunnelStep<K>[] {
  return steps.map((step, i) => {
    const previous = i === 0 ? null : steps[i - 1].value;
    return { ...step, ofPrevious: previous ? step.value / previous : null };
  });
}

/** Adds two daily series of the same length (profile views + product views). */
export function sumSeries(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + (b[i] ?? 0));
}
