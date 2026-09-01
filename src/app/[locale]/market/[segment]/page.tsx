import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSegmentKey } from "@/lib/marketplace/segments";
import { ListPageShell, FilterSidebar, PageHeader, CompanyRow, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { VerificationFilter } from "@/components/list-pages/verification-filter";
import { LocationFilter } from "@/components/list-pages/location-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";
import { SortControl } from "@/components/list-pages/sort-control";
import { isSortOption, type SortOption } from "@/components/list-pages/sort-options";
import type { VerificationTier } from "@/lib/trust/types";

const NO_MATCH_UUID = "00000000-0000-0000-0000-000000000000";

interface CompanyData {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
  certifications: string[] | null;
  created_at: string;
}

export default async function SegmentListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; segment: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, segment } = await params;
  if (!isSegmentKey(segment)) notFound();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Market" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const basePath = `/${locale}/market/${segment}`;
  const supabase = await createServerSupabaseClient();

  const sectorId = sp.sector;
  const tier = sp.tier;
  const region = sp.region;
  const sort: SortOption = isSortOption(sp.sort) ? sp.sort : "az";

  // Step 1: company ids that belong to this segment.
  const { data: rel } = await supabase
    .from("company_segments")
    .select("company_id")
    .eq("segment_key", segment);
  const segmentIds = (rel ?? []).map((r) => (r as { company_id: string }).company_id);

  // Step 2: query verified companies in that set, applying every facet DB-side
  // (the sector facet was previously a no-op).
  let q = supabase
    .from("companies")
    .select("id, name, logo_url, description, verification_tier, certifications, created_at")
    .eq("status", "verified")
    .in("id", segmentIds.length === 0 ? [NO_MATCH_UUID] : segmentIds);

  if (sectorId) q = q.eq("sector_id", sectorId);
  if (tier && tier !== "any") q = q.eq("verification_tier", tier as VerificationTier);
  if (region) q = q.eq("province", region);
  if (sort === "newest") q = q.order("created_at", { ascending: false });
  else q = q.order("name", { ascending: true });

  const { data } = await q;
  const companies = (data ?? []) as unknown as CompanyData[];

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sectorId} basePath={basePath} params={sp} />
          <VerificationFilter activeTier={tier} basePath={basePath} params={sp} />
          <LocationFilter locale={locale} activeRegion={region} basePath={basePath} params={sp} />
        </FilterSidebar>
      }
    >
      <nav className="text-xs text-muted-foreground mb-3">
        <a href={`/${locale}/market`} className="underline">{t("page.title")}</a>
        <span className="mx-2">/</span>
        <span>{t(`segments.${segment}`)}</span>
      </nav>
      <PageHeader title={t(`segments.${segment}`)} />

      <div className="mt-4 flex justify-end">
        <SortControl value={sort} />
      </div>

      <div className="my-3">
        <ActiveFiltersBar
          labels={{
            sector: tList("filters.sectors"),
            tier: tList("filters.verification"),
            region: tList("filters.region"),
          }}
        />
      </div>

      {companies.length === 0 ? (
        <EmptyState title={tList("results.empty")} />
      ) : (
        <div className="grid gap-3">
          {companies.map((c) => (
            <CompanyRow
              key={c.id}
              company={{
                id: c.id,
                name: c.name,
                logo_url: c.logo_url,
                description: c.description,
                verification_tier: (c.verification_tier ?? "none") as VerificationTier,
                tags: (c.certifications ?? []).slice(0, 6),
              }}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
