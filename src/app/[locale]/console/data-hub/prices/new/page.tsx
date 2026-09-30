import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SeriesForm } from "../series-form";

export default async function PricesNewPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sectors } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr")
    .order("name_en", { ascending: true });

  return <SeriesForm mode="create" sectors={sectors ?? []} />;
}
