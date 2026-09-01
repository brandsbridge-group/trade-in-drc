import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchResult } from "./types";

export async function runGlobalSearch(
  supabase: SupabaseClient,
  q: string,
  lang: "en" | "fr",
  maxPerType = 8,
): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const { data, error } = await supabase.rpc("global_search", { q, lang, max_per_type: maxPerType });
  if (error) {
    console.error("[search.runGlobalSearch]", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as SearchResult[];
}
