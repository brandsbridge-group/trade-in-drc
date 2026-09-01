import type { SupabaseClient } from "@supabase/supabase-js";
import type { Opportunity } from "./types";
import type { OpportunityCategory } from "./categories";

/** A sector option for the opportunities filter UI (bilingual labels). */
export interface SectorOption {
  id: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
}

/**
 * Deadline window presets for the public board filter. `all` applies no
 * deadline constraint; the others bound `deadline_at` relative to "now".
 */
export const DEADLINE_WINDOWS = ["all", "7d", "30d", "90d"] as const;
export type DeadlineWindow = (typeof DEADLINE_WINDOWS)[number];

export function isDeadlineWindow(value: unknown): value is DeadlineWindow {
  return (
    typeof value === "string" &&
    (DEADLINE_WINDOWS as readonly string[]).includes(value)
  );
}

const DEADLINE_WINDOW_DAYS: Record<Exclude<DeadlineWindow, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface ListPublishedOptions {
  category?: OpportunityCategory;
  sectorId?: string;
  deadline?: DeadlineWindow;
  limit?: number;
}

/** Result envelope so callers can render a real error state, not a silent []. */
export interface OpportunitiesResult {
  data: Opportunity[];
  error: string | null;
}

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  opts: ListPublishedOptions
) {
  let q = query;
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.sectorId) q = q.eq("sector_id", opts.sectorId);
  if (opts.deadline && opts.deadline !== "all") {
    const days = DEADLINE_WINDOW_DAYS[opts.deadline];
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    // Published items whose deadline falls within the window, plus items with
    // no deadline at all (open-ended opportunities should not be filtered out).
    q = q.or(`deadline_at.lte.${until},deadline_at.is.null`);
  }
  if (opts.limit) q = q.limit(opts.limit);
  return q;
}

/**
 * Backwards-compatible list of published opportunities. Returns `[]` on error
 * (legacy callers rely on this). Prefer {@link listPublishedResult} for new
 * call sites that should surface an error state.
 */
export async function listPublished(
  supabase: SupabaseClient,
  opts: ListPublishedOptions = {}
): Promise<Opportunity[]> {
  const { data } = await listPublishedResult(supabase, opts);
  return data;
}

/**
 * Published opportunities with category / sector / deadline filters, returning
 * an explicit `{ data, error }` envelope so list pages can show a real error
 * state instead of an indistinguishable empty list.
 */
export async function listPublishedResult(
  supabase: SupabaseClient,
  opts: ListPublishedOptions = {}
): Promise<OpportunitiesResult> {
  const base = supabase
    .from("opportunities")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const { data, error } = await applyFilters(base, opts);

  if (error) {
    console.error("[opportunities.listPublishedResult]", error.code, error.message);
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as unknown as Opportunity[], error: null };
}

/**
 * Load the sectors used to populate the opportunities sector filter. Returns
 * `[]` on error (filter just hides the sector group); failure is logged.
 */
export async function listSectorOptions(
  supabase: SupabaseClient
): Promise<SectorOption[]> {
  const { data, error } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr, name_tr, name_zh, name_es")
    .order("name_en", { ascending: true });
  if (error) {
    console.error("[opportunities.listSectorOptions]", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as SectorOption[];
}

/** A board row = opportunity + its (optionally verified) owning company. */
export interface OpportunityBoardRow extends Opportunity {
  company: {
    name: string;
    verification_tier: string | null;
    status: string | null;
  } | null;
}

export interface BoardListOptions {
  categories?: OpportunityCategory[];
  sectorId?: string;
  region?: string;
  keyword?: string;
  limit?: number;
}

/**
 * Opportunities-board listing (customer design 2): published opportunities
 * joined to their company, with tab (category set) / sector / province /
 * keyword filters. Left-joins the company so opportunities with an
 * unverified/absent company still list (the Verified tick is conditional).
 */
export async function listBoardOpportunities(
  supabase: SupabaseClient,
  opts: BoardListOptions = {}
): Promise<{ data: OpportunityBoardRow[]; error: string | null }> {
  let q = supabase
    .from("opportunities")
    .select("*, company:companies(name, verification_tier, status)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (opts.categories && opts.categories.length > 0) q = q.in("category", opts.categories);
  if (opts.sectorId) q = q.eq("sector_id", opts.sectorId);
  if (opts.region) q = q.eq("region", opts.region);
  if (opts.keyword) {
    const kw = opts.keyword.replace(/[%,]/g, " ").trim();
    if (kw) {
      q = q.or(
        `title_en.ilike.%${kw}%,title_fr.ilike.%${kw}%,summary_en.ilike.%${kw}%,summary_fr.ilike.%${kw}%`
      );
    }
  }
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) {
    console.error("[opportunities.listBoardOpportunities]", error.code, error.message);
    return { data: [], error: error.message };
  }
  return { data: (data ?? []) as unknown as OpportunityBoardRow[], error: null };
}

export async function getBySlug(
  supabase: SupabaseClient,
  category: OpportunityCategory,
  slug: string
): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as unknown as Opportunity;
}
