import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchTaxonomyOverview } from "@/lib/taxonomy/overview";
import { PageHeader } from "@/components/console/page-header";
import { TaxonomyWorkspace } from "@/components/console/taxonomy/taxonomy-workspace";

/**
 * Sectors, their categories (with each one's specification template), HS codes
 * and tags. The tree and its usage counts come from one staff-only database
 * function; the layout has already checked that the caller is staff.
 */
export default async function TaxonomyPage() {
  const t = await getTranslations("Taxonomy");
  const overview = await fetchTaxonomyOverview(await createServerSupabaseClient());

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <TaxonomyWorkspace overview={overview} />
    </div>
  );
}
