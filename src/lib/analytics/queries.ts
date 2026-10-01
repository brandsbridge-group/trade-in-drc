"use client";

import { createClient } from "@/lib/supabase/client";
import type { ContentItemType } from "@/lib/supabase/types";

/**
 * Owner-facing analytics shapes and the news feed reader.
 *
 * Counts no longer come from here: owners cannot SELECT analytics_events under
 * RLS (admin-only policy, 00001), so every number is read through the
 * owner_dashboard_metrics aggregate (00052, src/lib/dashboard/overview/metrics.ts).
 * The trend and entry shapes below are what the Statistics page cards consume.
 */

const NEWS_FEED_LIMIT = 6;

const NEWS_FEED_TYPES: ContentItemType[] = ["news", "event"];

export interface AnalyticsTrend {
  /** Headline count shown on the card (the current period). */
  total: number;
  /** Count within the current period. */
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
