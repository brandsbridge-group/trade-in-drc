import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { FilterGroup, FilterItem } from "@/components/design";
import { mergeFilterHref, type FilterParams } from "./filter-url";

interface Sector {
  id: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
}

export async function SectorsFilter({
  locale,
  activeId,
  basePath,
  params = {},
}: {
  locale: string;
  activeId?: string;
  basePath: string;
  params?: FilterParams;
}) {
  const t = await getTranslations({ locale, namespace: "ListPages.filters" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr, name_tr, name_zh, name_es")
    .order("name_en");
  const sectors = ((data ?? []) as unknown as Sector[]);
  return (
    <FilterGroup label={t("sectors")}>
      <FilterItem
        label={t("any")}
        href={mergeFilterHref(basePath, params, "sector", undefined)}
        active={!activeId}
      />
      {sectors.map((s) => (
        <FilterItem
          key={s.id}
          label={pickLocalized(s, "name", locale as Locale)}
          href={mergeFilterHref(basePath, params, "sector", s.id)}
          active={activeId === s.id}
        />
      ))}
    </FilterGroup>
  );
}
