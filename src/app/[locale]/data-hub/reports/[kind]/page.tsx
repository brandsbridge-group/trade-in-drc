import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReportKind } from "@/lib/data-hub/kinds";
import { listReports } from "@/lib/data-hub/queries";
import { ReportCard } from "@/components/data-hub/report-card";
import { ListPageShell, FilterSidebar, PageHeader, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

export default async function ReportsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; kind: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, kind } = await params;
  if (!isReportKind(kind)) notFound();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const supabase = await createServerSupabaseClient();
  const items = await listReports(supabase, kind);
  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter
            locale={locale}
            activeId={sp.sector}
            basePath={`/${locale}/data-hub/reports/${kind}`}
          />
        </FilterSidebar>
      }
    >
      <PageHeader title={t(`pillars.${kind}.title`)} subtitle={t(`pillars.${kind}.body`)} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors") }} />
      {items.length === 0 ? (
        <EmptyState title={t("list.empty")} />
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <ReportCard key={r.id} item={r} locale={locale} />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
