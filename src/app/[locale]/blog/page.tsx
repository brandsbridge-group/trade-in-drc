import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listPublishedByType } from "@/lib/content/list";
import { ContentCard } from "@/components/content/content-card";
import { ListPageShell, FilterSidebar, PageHeader, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Content.blog" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const supabase = await createServerSupabaseClient();
  const items = await listPublishedByType(supabase, "blog", {
    limit: 50,
    sectorId: sp.sector,
  });

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={`/${locale}/blog`} />
        </FilterSidebar>
      }
    >
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors") }} />
      {items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="grid gap-3">
          {items.map((i) => (
            <ContentCard key={i.id} item={i} locale={locale} />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
