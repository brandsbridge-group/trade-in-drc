import { createClient } from "@/lib/supabase/client";
import type { MetricSeries, OverviewPeriod } from "@/lib/dashboard/overview/metrics";

/**
 * Staff console home aggregates, read through the `console_dashboard_metrics`
 * SECURITY DEFINER function (migration 00059, staff only). Everything is
 * counted in the database: the browser never reads raw companies or
 * analytics_events rows, so there is no 1000-row cap and no RLS blind spot.
 */

export type ConsoleMetricKey =
  | "companies_drc"
  | "companies_intl"
  | "users"
  | "products"
  | "opportunities"
  | "conversations"
  | "responses"
  | "profile_views"
  | "product_views"
  | "search_appearances"
  | "contact_requests";

export const QUEUE_KEYS = ["verifications", "opportunities", "requests", "premium", "reports"] as const;
export type QueueKey = (typeof QUEUE_KEYS)[number];

export interface QueueEntry {
  count: number;
  /** ISO timestamp of the item that has waited longest; null when the queue is empty. */
  oldest: string | null;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface ConsoleDashboardMetrics {
  period_days: number;
  current_start: string;
  previous_start: string;
  metrics: Record<ConsoleMetricKey, MetricSeries>;
  queue: Record<QueueKey, QueueEntry>;
  funnel: {
    registered: number;
    submitted: number;
    verified: number;
    rejected: number;
    not_submitted: number;
    to_review: number;
    awaiting_owner: number;
  };
  reviews: { approved: number; rejected: number; more_info: number; median_decision_hours: number | null };
  totals: {
    users: number;
    products: number;
    products_published: number;
    opportunities_published: number;
    conversations: number;
  };
  origin: { drc: number; intl: number; provinces: NamedCount[]; countries: NamedCount[] };
  sectors: { id: string; name_en: string; name_fr: string; count: number; verified: number }[];
  categories: { category: string; published: number; pending: number; responses: number }[];
  premium: {
    active: number;
    expiring_30d: number;
    by_plan: { plan: string; count: number }[];
    approved_count: number;
    approved_amount_usd: number;
  };
  top_companies: { id: string; name: string; status: string; views: number; contacts: number }[];
}

export async function fetchConsoleDashboardMetrics(days: OverviewPeriod): Promise<ConsoleDashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("console_dashboard_metrics", { p_days: days });
  if (error) throw new Error(`console_dashboard_metrics failed: ${error.message}`);
  return data as ConsoleDashboardMetrics;
}

/** Two counted metrics read as one (same days, same periods). */
export function sumMetrics(a: MetricSeries, b: MetricSeries): MetricSeries {
  return {
    current: a.current + b.current,
    previous: a.previous + b.previous,
    series: a.series.map((v, i) => v + (b.series[i] ?? 0)),
  };
}
