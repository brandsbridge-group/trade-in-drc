import type { SupabaseClient } from "@supabase/supabase-js";
import { runGlobalSearch } from "@/lib/search/api";

/**
 * Resolve full-text matches for a given entity type into an ordered id list.
 *
 * The directory / marketplace list pages let a user combine a free-text query
 * with sidebar facets. We run the shared `global_search` RPC (00009) once, keep
 * only the rows of the requested entity type, and return their ids in rank
 * order. The page then intersects these ids with its faceted query and — when
 * the active sort is "relevance" — preserves this order.
 *
 * Returns `null` when there is no query (caller skips FTS filtering entirely),
 * and an empty array when the query matched nothing (caller renders empty).
 */
export async function ftsEntityIds(
  supabase: SupabaseClient,
  q: string,
  lang: "en" | "fr",
  entityType: "company" | "product",
  maxPerType = 50,
): Promise<string[] | null> {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const rows = await runGlobalSearch(supabase, trimmed, lang, maxPerType);
  return rows
    .filter((r) => r.entity_type === entityType)
    .map((r) => r.entity_id);
}

/** Order `ids` by their position in `rankedIds` (relevance order). */
export function orderByRank<T extends { id: string }>(items: T[], rankedIds: string[]): T[] {
  const rank = new Map(rankedIds.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
  );
}
