import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FilterGroup, FilterItem } from "@/components/design";
import { mergeFilterHref, type FilterParams } from "./filter-url";

/**
 * Location facet (Req 5 — faceted filters). Lists the distinct provinces of
 * verified companies pulled from the PII-free `companies_public` view, so the
 * options always reflect real, browsable data. Selecting a province merges a
 * `region` param into the URL (matched against `companies.province`).
 */
export async function LocationFilter({
  locale,
  activeRegion,
  basePath,
  params = {},
}: {
  locale: string;
  activeRegion?: string;
  basePath: string;
  params?: FilterParams;
}) {
  const t = await getTranslations({ locale, namespace: "ListPages.filters" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("companies_public")
    .select("province")
    .not("province", "is", null);

  const provinces = Array.from(
    new Set(
      ((data ?? []) as { province: string | null }[])
        .map((r) => r.province?.trim())
        .filter((p): p is string => Boolean(p)),
    ),
  ).sort((a, b) => a.localeCompare(b, locale));

  if (provinces.length === 0) return null;

  return (
    <FilterGroup label={t("region")}>
      <FilterItem
        label={t("any")}
        href={mergeFilterHref(basePath, params, "region", undefined)}
        active={!activeRegion}
      />
      {provinces.map((province) => (
        <FilterItem
          key={province}
          label={province}
          href={mergeFilterHref(basePath, params, "region", province)}
          active={activeRegion === province}
        />
      ))}
    </FilterGroup>
  );
}
