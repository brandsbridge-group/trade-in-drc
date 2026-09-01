"use client";

import { createClient } from "@/lib/supabase/client";
import type { AnalyticsEventType, ContentItemType } from "@/lib/supabase/types";

/**
 * Owner-facing business analytics readers (Req 11 / GAP #25, #26).
 *
 * Reads the real `analytics_events` table (migrations 00001 + 00021) and the
 * published `content_items` feed (migration 00005). Every query runs through the
 * browser Supabase client under RLS, so an owner only ever sees rows for the
 * companies and products they own.
 *
 * Schema reality that shapes these queries: `analytics_events` stores only
 * (entity_type, entity_id, event_type, visitor_id, created_at). There is NO
 * column holding the literal search-query string. A `search_query` row therefore
 * ties a search occurrence to the entity it surfaced, not to the term text. The
 * truthful "what led buyers to you" aggregation we can build is the set of the
 * owner's entries that most often surfaced from search, resolved to their names —
 * see {@link fetchTopSearchEntries}.
 */

const TREND_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_SEARCH_ENTRIES_LIMIT = 5;
const NEWS_FEED_LIMIT = 6;

const PROFILE_VIEW_EVENTS: AnalyticsEventType[] = ["profile_view", "view"];
const SEARCH_APPEARANCE_EVENT: AnalyticsEventType = "search_appearance";
const SEARCH_QUERY_EVENT: AnalyticsEventType = "search_query";

const NEWS_FEED_TYPES: ContentItemType[] = ["news", "event"];

export interface AnalyticsTrend {
  /** Total count across the full available history. */
  total: number;
  /** Count within the most recent {@link TREND_WINDOW_DAYS}-day window. */
  recent: number;
  /** Count within the window immediately preceding the recent one. */
  previous: number;
  /**
   * Signed percentage change of `recent` versus `previous`, rounded to a whole
   * number. `null` when `previous` is 0 (no baseline → percentage undefined).
   */
  changePct: number | null;
}

export interface TopSearchEntry {
  entityType: "company" | "product";
  entityId: string;
  nameEn: string | null;
  nameFr: string | null;
  appearances: number;
}

export interface NewsFeedItem {
  id: string;
  type: ContentItemType;
  slug: string;
  titleEn: string;
  titleFr: string;
  excerptEn: string | null;
  excerptFr: string | null;
  publishedAt: string | null;
  eventStartAt: string | null;
}

export interface OwnerAnalyticsScope {
  companyIds: string[];
  productIds: string[];
}

/** Build the {@link AnalyticsTrend} buckets from a list of event timestamps. */
function buildTrend(timestamps: string[]): AnalyticsTrend {
  const now = Date.now();
  const recentCutoff = now - TREND_WINDOW_DAYS * DAY_MS;
  const previousCutoff = now - 2 * TREND_WINDOW_DAYS * DAY_MS;

  let recent = 0;
  let previous = 0;
  for (const ts of timestamps) {
    const t = new Date(ts).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= recentCutoff) {
      recent += 1;
    } else if (t >= previousCutoff) {
      previous += 1;
    }
  }

  const changePct =
    previous === 0 ? null : Math.round(((recent - previous) / previous) * 100);

  return { total: timestamps.length, recent, previous, changePct };
}

/**
 * Resolve the owner's product ids for a set of companies. Returns an empty array
 * when there are no companies. Used to widen analytics scope so product-level
 * search appearances roll up to the owner's totals.
 */
export async function fetchOwnerProductIds(
  companyIds: string[]
): Promise<string[]> {
  if (companyIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .in("company_id", companyIds);
  if (error) {
    throw new Error(`Failed to load product ids: ${error.message}`);
  }
  return (data ?? []).map((row) => row.id);
}

/**
 * Profile-view trend for the owner's companies. Counts both the current
 * `profile_view` event and the legacy `view` event (migration 00001) so totals
 * stay continuous across the 00021 event-type rename.
 */
export async function fetchProfileViewTrend(
  companyIds: string[]
): Promise<AnalyticsTrend> {
  if (companyIds.length === 0) {
    return { total: 0, recent: 0, previous: 0, changePct: null };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .eq("entity_type", "company")
    .in("entity_id", companyIds)
    .in("event_type", PROFILE_VIEW_EVENTS);
  if (error) {
    throw new Error(`Failed to load profile views: ${error.message}`);
  }
  return buildTrend((data ?? []).map((row) => row.created_at));
}

/**
 * Search-appearance trend for the owner's companies and products combined —
 * every time one of the owner's entities surfaced in a buyer's search result set.
 */
export async function fetchSearchAppearanceTrend(
  scope: OwnerAnalyticsScope
): Promise<AnalyticsTrend> {
  const entityIds = [...scope.companyIds, ...scope.productIds];
  if (entityIds.length === 0) {
    return { total: 0, recent: 0, previous: 0, changePct: null };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("created_at")
    .in("entity_id", entityIds)
    .eq("event_type", SEARCH_APPEARANCE_EVENT);
  if (error) {
    throw new Error(`Failed to load search appearances: ${error.message}`);
  }
  return buildTrend((data ?? []).map((row) => row.created_at));
}

/**
 * Top entries that led buyers to the owner from search.
 *
 * Aggregates `search_query` events by `entity_id`, ranks the owner's own
 * companies/products by frequency, and resolves each to its bilingual name. This
 * is the schema-honest form of "top search terms": the literal query string is
 * not stored on `analytics_events`, so we surface the destinations that searches
 * most often resolved to rather than fabricating term text.
 */
export async function fetchTopSearchEntries(
  scope: OwnerAnalyticsScope
): Promise<TopSearchEntry[]> {
  const entityIds = [...scope.companyIds, ...scope.productIds];
  if (entityIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("entity_type, entity_id")
    .in("entity_id", entityIds)
    .eq("event_type", SEARCH_QUERY_EVENT);
  if (error) {
    throw new Error(`Failed to load search queries: ${error.message}`);
  }

  const counts = new Map<string, { entityType: "company" | "product"; count: number }>();
  for (const row of data ?? []) {
    if (row.entity_type !== "company" && row.entity_type !== "product") continue;
    const current = counts.get(row.entity_id);
    if (current) {
      current.count += 1;
    } else {
      counts.set(row.entity_id, { entityType: row.entity_type, count: 1 });
    }
  }

  const ranked = [...counts.entries()]
    .map(([entityId, { entityType, count }]) => ({ entityId, entityType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_SEARCH_ENTRIES_LIMIT);

  if (ranked.length === 0) return [];

  const companyIdsToResolve = ranked.filter((r) => r.entityType === "company").map((r) => r.entityId);
  const productIdsToResolve = ranked.filter((r) => r.entityType === "product").map((r) => r.entityId);

  const nameByEntity = new Map<string, { nameEn: string | null; nameFr: string | null }>();

  if (companyIdsToResolve.length > 0) {
    const { data: companyRows, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIdsToResolve);
    if (companyError) {
      throw new Error(`Failed to resolve company names: ${companyError.message}`);
    }
    for (const row of companyRows ?? []) {
      nameByEntity.set(row.id, { nameEn: row.name, nameFr: row.name });
    }
  }

  if (productIdsToResolve.length > 0) {
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, name_en, name_fr, name")
      .in("id", productIdsToResolve);
    if (productError) {
      throw new Error(`Failed to resolve product names: ${productError.message}`);
    }
    for (const row of productRows ?? []) {
      nameByEntity.set(row.id, {
        nameEn: row.name_en ?? row.name,
        nameFr: row.name_fr ?? row.name,
      });
    }
  }

  return ranked.map((r) => {
    const name = nameByEntity.get(r.entityId);
    return {
      entityType: r.entityType,
      entityId: r.entityId,
      nameEn: name?.nameEn ?? null,
      nameFr: name?.nameFr ?? null,
      appearances: r.count,
    };
  });
}

/**
 * Latest published commerce news + events feed (migration 00005). Read-only:
 * owners consume the same published content surfaced on the public site.
 */
export async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(
      "id, type, slug, title_en, title_fr, excerpt_en, excerpt_fr, published_at, event_start_at"
    )
    .in("type", NEWS_FEED_TYPES)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(NEWS_FEED_LIMIT);
  if (error) {
    throw new Error(`Failed to load news feed: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    slug: row.slug,
    titleEn: row.title_en,
    titleFr: row.title_fr,
    excerptEn: row.excerpt_en,
    excerptFr: row.excerpt_fr,
    publishedAt: row.published_at,
    eventStartAt: row.event_start_at,
  }));
}
