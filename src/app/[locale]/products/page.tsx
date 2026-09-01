import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ListPageShell,
  FilterSidebar,
  PageHeader,
  ProductCardDesign,
  EmptyState,
} from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";
import { SearchBox } from "@/components/list-pages/search-box";
import { SortControl } from "@/components/list-pages/sort-control";
import { isSortOption, type SortOption } from "@/components/list-pages/sort-options";
import { ftsEntityIds, orderByRank } from "@/components/list-pages/fts-ids";
import type { VerificationTier } from "@/lib/trust/types";

const NO_MATCH_UUID = "00000000-0000-0000-0000-000000000000";

interface ProductRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  images: string[] | null;
  company_id: string;
  created_at: string;
  companies: { name: string; verification_tier: string | null; status: string } | null;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "ListPages" });
  const tProducts = await getTranslations({ locale, namespace: "Products" });
  const tCompanies = await getTranslations({ locale, namespace: "Companies" });
  const basePath = `/${locale}/products`;
  const supabase = await createServerSupabaseClient();

  const sectorId = sp.sector;
  const query = (sp.q ?? "").trim();
  const sort: SortOption = isSortOption(sp.sort) ? sp.sort : query ? "relevance" : "newest";

  const matchedIds = await ftsEntityIds(supabase, query, locale as "en" | "fr", "product");
  const hasNoTextMatches = matchedIds !== null && matchedIds.length === 0;

  // Inner join on companies so the sector filter actually constrains the
  // parent company (and only verified companies are shown).
  let q = supabase
    .from("products")
    .select(
      "id, name, name_en, name_fr, images, company_id, created_at, companies!inner(name, verification_tier, status, sector_id)",
    )
    .eq("companies.status", "verified");

  if (sectorId) q = q.eq("companies.sector_id", sectorId);
  if (matchedIds !== null) {
    q = q.in("id", matchedIds.length === 0 ? [NO_MATCH_UUID] : matchedIds);
  }

  if (sort === "az") q = q.order("name", { ascending: true });
  else q = q.order("created_at", { ascending: false });
  q = q.limit(60);

  const { data } = await q;
  let rows = ((data ?? []) as unknown as ProductRow[]).filter((p) => p.companies);

  if (sort === "relevance" && matchedIds && matchedIds.length > 0) {
    rows = orderByRank(rows, matchedIds);
  }

  function productName(p: ProductRow): string {
    const localized = locale === "fr" ? p.name_fr : p.name_en;
    return localized ?? p.name_en ?? p.name;
  }

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sectorId} basePath={basePath} params={sp} />
        </FilterSidebar>
      }
    >
      <PageHeader title={tProducts("title")} subtitle={tProducts("description")} />

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1">
          <SearchBox placeholder={tCompanies("search")} />
        </div>
        <SortControl value={sort} />
      </div>

      <div className="my-4">
        <ActiveFiltersBar labels={{ sector: t("filters.sectors") }} />
      </div>

      {rows.length === 0 || hasNoTextMatches ? (
        <EmptyState title={t("results.empty")} />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => (
            <ProductCardDesign
              key={p.id}
              item={{
                id: p.id,
                name: productName(p),
                image_url: p.images?.[0] ?? null,
                company_id: p.company_id,
                company_name: p.companies?.name ?? null,
                verificationTier: (p.companies?.verification_tier ?? null) as VerificationTier | null,
              }}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
