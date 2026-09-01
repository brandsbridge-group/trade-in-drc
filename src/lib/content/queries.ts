import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentItem, ContentType } from "./types";

export async function listPublished(
  supabase: SupabaseClient,
  type: ContentType,
  opts: { limit?: number } = {}
): Promise<ContentItem[]> {
  const { limit = 20 } = opts;
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[content.listPublished]", error.code, error.message);
    return [];
  }
  return (data ?? []) as ContentItem[];
}

export async function getBySlug(
  supabase: SupabaseClient,
  type: ContentType,
  slug: string
): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as ContentItem;
}
