import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentItem, ContentType } from "./types";

interface ListContentOptions {
  limit?: number;
  /** When provided, restricts results to a single sector (the sidebar facet). */
  sectorId?: string;
  /** Order key: news/blog list by published_at; events list by event_start_at. */
  orderBy?: "published_at" | "event_start_at";
}

/**
 * List published content of a given type, optionally filtered by sector.
 *
 * This complements `queries.listPublished` by actually applying the sector facet
 * the public list pages expose in their sidebar (previously decorative). It
 * fails safe (returns []) and logs the PostgREST error code/message.
 */
export async function listPublishedByType(
  supabase: SupabaseClient,
  type: ContentType,
  opts: ListContentOptions = {}
): Promise<ContentItem[]> {
  const { limit = 50, sectorId, orderBy = "published_at" } = opts;

  let query = supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("status", "published");

  // Only apply the sector facet when a non-empty id is present.
  if (sectorId && sectorId.trim().length > 0) {
    query = query.eq("sector_id", sectorId);
  }

  query =
    orderBy === "event_start_at"
      ? query.order("event_start_at", { ascending: true, nullsFirst: false })
      : query.order("published_at", { ascending: false });

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error("[content.listPublishedByType]", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as ContentItem[];
}
