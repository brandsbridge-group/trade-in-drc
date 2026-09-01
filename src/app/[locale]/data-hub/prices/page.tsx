import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSeries } from "@/lib/data-hub/queries";
import { Link } from "@/i18n/routing";
import { ListPageShell, FilterSidebar, PageHeader, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

export default async function PricesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const supabase = await createServerSupabaseClient();
  const items = await listSeries(supabase);
  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter
            locale={locale}
            activeId={sp.sector}
            basePath={`/${locale}/data-hub/prices`}
          />
        </FilterSidebar>
      }
    >
      <PageHeader title={t("pillars.prices.title")} subtitle={t("pillars.prices.body")} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors") }} />
      {items.length === 0 ? (
        <EmptyState title={t("list.empty")} />
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/data-hub/prices/${s.id}`}
                className="block border border-slate-200 rounded-xl p-3 bg-card hover:bg-muted/40 text-sm"
              >
                <span className="font-medium">
                  {locale === "fr" ? s.commodity_fr : s.commodity_en}
                </span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {s.currency}/{s.unit}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListPageShell>
  );
}
