import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportKind } from "./kinds";
import type { Report, PriceSeries, PricePoint } from "./types";

// Per the Data Hub spec, the public price-trend detail defaults to a rolling
// 12-month window so visitors see recent movement, not the entire history.
export const DEFAULT_PRICE_WINDOW_MONTHS = 12;

/** ISO timestamp for `monthsBack` months before now (UTC), used to bound queries. */
export function windowStartIso(monthsBack: number): string {
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() - monthsBack);
  return start.toISOString();
}

export async function listReports(supabase: SupabaseClient, kind: ReportKind): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("kind", kind)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) { console.error("[data-hub.listReports]", error.code, error.message); return []; }
  return (data ?? []) as unknown as Report[];
}

export async function getReportBySlug(supabase: SupabaseClient, kind: ReportKind, slug: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as unknown as Report;
}

export async function listSeries(supabase: SupabaseClient): Promise<PriceSeries[]> {
  const { data, error } = await supabase
    .from("price_series")
    .select("*")
    .eq("status", "published")
    .order("commodity_en", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as PriceSeries[];
}

export async function getSeriesWithPoints(
  supabase: SupabaseClient,
  id: string,
  opts: { monthsWindow?: number } = {},
): Promise<{ series: PriceSeries | null; points: PricePoint[]; windowMonths: number }> {
  const windowMonths = opts.monthsWindow ?? DEFAULT_PRICE_WINDOW_MONTHS;
  const { data: series } = await supabase
    .from("price_series")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (!series) return { series: null, points: [], windowMonths };
  let query = supabase
    .from("price_points")
    .select("*")
    .eq("series_id", id)
    .order("observed_at", { ascending: true });
  // windowMonths <= 0 means "all history"; otherwise bound to the rolling window.
  if (windowMonths > 0) {
    query = query.gte("observed_at", windowStartIso(windowMonths));
  }
  const { data: points } = await query;
  return {
    series: series as unknown as PriceSeries,
    points: (points ?? []) as unknown as PricePoint[],
    windowMonths,
  };
}
