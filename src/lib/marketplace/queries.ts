import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Origin } from "./offers";

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/** Live number of verified offers per direction (same rule as /products?origin=). */
export async function countOffersByOrigin(supabase: Supabase): Promise<Record<Origin, number>> {
  const count = (profile: "international" | "congolese") =>
    supabase
      .from("products")
      .select("id, companies!inner(status, registration_profile)", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("companies.status", "verified")
      .eq("companies.registration_profile", profile);
  const [imp, exp] = await Promise.all([count("international"), count("congolese")]);
  return { import: imp.count ?? 0, export: exp.count ?? 0 };
}
