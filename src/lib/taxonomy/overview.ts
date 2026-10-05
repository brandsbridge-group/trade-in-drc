import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { TaxonomyOverview } from "./terms";

/**
 * The taxonomy tree with its usage counts, read through the
 * `console_taxonomy_overview()` SECURITY DEFINER function (00066, staff only).
 * Usage is counted in the database: counting in the browser would go through
 * RLS and the 1000-row cap, and a wrong count would show a used entry as
 * deletable.
 */
export async function fetchTaxonomyOverview(supabase: SupabaseClient<Database>): Promise<TaxonomyOverview> {
  const { data, error } = await supabase.rpc("console_taxonomy_overview");
  if (error) throw new Error(`console_taxonomy_overview failed: ${error.message}`);
  return data as TaxonomyOverview;
}
