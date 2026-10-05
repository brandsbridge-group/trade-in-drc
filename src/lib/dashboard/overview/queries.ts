import { createClient } from "@/lib/supabase/client";
import type { OpportunityStatus } from "@/lib/opportunities/types";

/**
 * Dashboard-home reads that go through ordinary RLS (the owner can read their
 * own products, media, opportunities and the responses to them, plus any
 * published opportunity). Analytics live in ./metrics.ts instead.
 */

/** Window for "new" responses on the owner's opportunities. */
export const NEW_RESPONSE_DAYS = 7;
const RECOMMENDED_LIMIT = 4;
const MY_OPPORTUNITIES_LIMIT = 5;

export interface OwnerContent {
  productCountByCompany: Record<string, number>;
  photoCountByCompany: Record<string, number>;
}

export async function fetchOwnerContent(companyIds: string[]): Promise<OwnerContent> {
  const supabase = createClient();
  const [products, media] = await Promise.all([
    supabase.from("products").select("company_id").in("company_id", companyIds),
    supabase.from("company_media").select("company_id").eq("kind", "gallery").in("company_id", companyIds),
  ]);
  if (products.error) throw products.error;
  if (media.error) throw media.error;

  const tally = (rows: { company_id: string }[] | null) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.company_id] = (acc[r.company_id] ?? 0) + 1;
      return acc;
    }, {});

  return { productCountByCompany: tally(products.data), photoCountByCompany: tally(media.data) };
}

export interface MyOpportunity {
  id: string;
  title_en: string;
  title_fr: string;
  status: OpportunityStatus;
  rejected_reason: string | null;
  published_at: string | null;
  created_at: string;
  responses: number;
  newResponses: number;
}

export interface MyOpportunities {
  items: MyOpportunity[];
  countByStatus: Partial<Record<OpportunityStatus, number>>;
  total: number;
  newResponses: number;
}

export async function fetchMyOpportunities(
  companyIds: string[],
  userId: string,
  now: Date
): Promise<MyOpportunities> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title_en, title_fr, status, rejected_reason, published_at, created_at, opportunity_responses(created_at, responder_id)")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const cutoff = now.getTime() - NEW_RESPONSE_DAYS * 24 * 60 * 60 * 1000;
  const countByStatus: Partial<Record<OpportunityStatus, number>> = {};
  let newResponses = 0;

  type Row = Omit<MyOpportunity, "responses" | "newResponses"> & {
    opportunity_responses: { created_at: string; responder_id: string }[] | null;
  };
  const items = ((data ?? []) as unknown as Row[]).map((row) => {
    countByStatus[row.status] = (countByStatus[row.status] ?? 0) + 1;
    const received = (row.opportunity_responses ?? []).filter((r) => r.responder_id !== userId);
    const fresh = received.filter((r) => new Date(r.created_at).getTime() >= cutoff).length;
    newResponses += fresh;
    return {
      id: row.id,
      title_en: row.title_en,
      title_fr: row.title_fr,
      status: row.status,
      rejected_reason: row.rejected_reason,
      published_at: row.published_at,
      created_at: row.created_at,
      responses: received.length,
      newResponses: fresh,
    };
  });

  // Rejected ones stay visible (they need fixing), then the most recent.
  items.sort((a, b) => Number(b.status === "rejected") - Number(a.status === "rejected"));

  return { items: items.slice(0, MY_OPPORTUNITIES_LIMIT), countByStatus, total: items.length, newResponses };
}

export interface RecommendedOpportunity {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  category: string;
  region: string | null;
  deadline_at: string | null;
  published_at: string | null;
}

export interface Recommendations {
  items: RecommendedOpportunity[];
  total: number;
}

/**
 * Published opportunities from other companies in the owner's sectors, still
 * open, newest first. `provinces` narrows to the target provinces an
 * international company declared at registration.
 */
export async function fetchRecommendedOpportunities(params: {
  sectorIds: string[];
  ownCompanyIds: string[];
  provinces: string[];
  now: Date;
}): Promise<Recommendations> {
  if (params.sectorIds.length === 0) return { items: [], total: 0 };
  const supabase = createClient();
  let query = supabase
    .from("opportunities")
    .select("id, slug, title_en, title_fr, category, region, deadline_at, published_at", { count: "exact" })
    .eq("status", "published")
    .in("sector_id", params.sectorIds)
    // Imported tenders (00050) have no company: keep them. Separate .or() calls
    // are ANDed by PostgREST (verified against the live API).
    .or(`company_id.is.null,company_id.not.in.(${params.ownCompanyIds.join(",")})`)
    .or(`deadline_at.is.null,deadline_at.gte.${params.now.toISOString()}`)
    .order("published_at", { ascending: false })
    .limit(RECOMMENDED_LIMIT);
  if (params.provinces.length > 0) query = query.in("region", params.provinces);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as RecommendedOpportunity[], total: count ?? 0 };
}

export interface SupplierMatch {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  logo_url: string | null;
}

const SUPPLIER_LIMIT = 3;

/** Verified Congolese companies in the owner's sectors (for international buyers). */
export async function fetchMatchingSuppliers(params: {
  sectorIds: string[];
  ownCompanyIds: string[];
  homeCountry: string;
}): Promise<SupplierMatch[]> {
  if (params.sectorIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies_public")
    .select("id, name, city, province, logo_url")
    .eq("country", params.homeCountry)
    .in("sector_id", params.sectorIds)
    .not("id", "in", `(${params.ownCompanyIds.join(",")})`)
    .order("updated_at", { ascending: false })
    .limit(SUPPLIER_LIMIT);
  if (error) throw error;
  return (data ?? []) as SupplierMatch[];
}

export interface PriceWatchItem {
  id: string;
  commodity_en: string;
  commodity_fr: string;
  unit: string;
  currency: string;
  latest: number;
  /** Change versus the previous observation, in percent (one decimal). */
  changePct: number | null;
}

export interface MarketWatch {
  prices: PriceWatchItem[];
  report: { kind: string; slug: string; title_en: string; title_fr: string; published_at: string | null } | null;
}

const PRICE_WATCH_LIMIT = 2;

/** Latest Data Hub prices (the owner's sectors first) and the newest report. */
export async function fetchMarketWatch(sectorIds: string[]): Promise<MarketWatch> {
  const supabase = createClient();
  const [seriesRes, reportRes] = await Promise.all([
    supabase
      .from("price_series")
      .select("id, commodity_en, commodity_fr, unit, currency, sector_id")
      .eq("status", "published"),
    supabase
      .from("reports")
      .select("kind, slug, title_en, title_fr, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1),
  ]);
  if (seriesRes.error) throw seriesRes.error;
  if (reportRes.error) throw reportRes.error;

  type SeriesRow = Omit<PriceWatchItem, "latest" | "changePct"> & { sector_id: string | null };
  const series = ((seriesRes.data ?? []) as SeriesRow[])
    .sort((a, b) => Number(sectorIds.includes(b.sector_id ?? "")) - Number(sectorIds.includes(a.sector_id ?? "")))
    .slice(0, PRICE_WATCH_LIMIT);

  const prices = await Promise.all(
    series.map(async (s): Promise<PriceWatchItem | null> => {
      const { data } = await supabase
        .from("price_points")
        .select("value")
        .eq("series_id", s.id)
        .order("observed_at", { ascending: false })
        .limit(2);
      const [latest, previous] = (data ?? []) as { value: number }[];
      if (!latest) return null;
      const changePct =
        previous && previous.value !== 0
          ? Math.round(((latest.value - previous.value) / previous.value) * 1000) / 10
          : null;
      return {
        id: s.id,
        commodity_en: s.commodity_en,
        commodity_fr: s.commodity_fr,
        unit: s.unit,
        currency: s.currency,
        latest: latest.value,
        changePct,
      };
    })
  );

  return {
    prices: prices.filter((p): p is PriceWatchItem => p !== null),
    report: (reportRes.data?.[0] as MarketWatch["report"]) ?? null,
  };
}
