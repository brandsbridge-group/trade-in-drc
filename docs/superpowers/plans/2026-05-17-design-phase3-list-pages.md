# Design Phase 3 — Public List Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Reskin every public list page to use the Phase 1 design-system primitives. Same content, same data fetches, new visual grammar (compact `<ListPageShell>`, `<FilterSidebar>`, dense card rows, RFQ banner between sections).

**Architecture:** Each page becomes a thin server-component composer over the Phase 1 primitives. Sidebar filters use real DB taxonomies (sectors, segments, categories). Search/filter state stays via URL query params for SEO and shareability.

**Pages in scope (8):**
1. `/companies` — Companies list
2. `/products` — Products list
3. `/opportunities` — Opportunities list (overlay of S5 work)
4. `/market` — Marketplace landing (segment shelves)
5. `/market/[segment]` — Per-segment company list
6. `/news`, `/events`, `/blog` — Content lists (S3)
7. `/data-hub/reports/[kind]` — Data Hub reports list
8. `/data-hub/prices` — Price series list

**No commits per task. No `git add`.** Orchestrator runs verify + ship-wreck + single commit at end of phase.

---

## File Structure

**Create:**
- `src/components/list-pages/sectors-filter.tsx` — server component, queries sectors, renders inside `<FilterGroup>`.
- `src/components/list-pages/segments-filter.tsx` — client component, renders the 8 canonical segments as checkboxes/links.
- `src/components/list-pages/verification-filter.tsx` — client component, 4-tier radio.
- `src/components/list-pages/active-filters-bar.tsx` — client component, reads URL params + renders `<FilterChip>` row + Reset button.

**Modify (8 pages):**
- `src/app/[locale]/companies/page.tsx`
- `src/app/[locale]/products/page.tsx`
- `src/app/[locale]/opportunities/page.tsx`
- `src/app/[locale]/market/page.tsx`
- `src/app/[locale]/market/[segment]/page.tsx`
- `src/app/[locale]/news/page.tsx`
- `src/app/[locale]/events/page.tsx`
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/data-hub/reports/[kind]/page.tsx`
- `src/app/[locale]/data-hub/prices/page.tsx`

(That's 10 page files — the 8 page groups above; `/market` and `/market/[segment]` are separate routes.)

**Modify:**
- `src/config/messages/en.json` + `fr.json` — add `ListPages.*` namespace (filter labels reused across all list pages).

---

## Conventions for every reskinned page

1. The page is a **Server Component** that:
   - Reads `params` and `searchParams` (both as `Promise<…>`).
   - Fetches data via `createServerSupabaseClient`.
   - Renders a `<PageHeader title subtitle>` + (optionally) `<RfqCtaBanner>` above results + `<ListPageShell sidebar>` wrapping `<FilterSidebar>` (left) and the card grid (right).
2. **Sidebar always present** (md+) — even if filter groups are sparse. Sidebar contents per page:
   - Companies / Products: sectors + segments + verification + country.
   - Opportunities: category + sector + region + deadline window (region as text + deadline as preset chips).
   - Market segment: sectors + verification.
   - News/Events/Blog: tags + sector.
   - Data Hub reports: sectors + tag.
   - Data Hub prices: sectors only.
3. **Cards always use the design primitives:**
   - Companies list → `<CompanyRow>`.
   - Products / Market shelves → `<ProductCardDesign>`.
   - Opportunities → `<OpportunityCardDesign>`.
   - News / Events / Blog → reuse `<ContentCard>` from S3 (kept; it already matches the new grammar).
   - Reports → `<ReportCard>` from S6.
4. **Active-filters chip row** above the result grid using `<FilterChip>` per active filter, plus a "Reset" button at the end.
5. **Empty state** uses `<EmptyState>` from Phase 1.
6. **Pagination**: keep existing pagination logic where present; do not redesign in this phase.

---

## Task 1: `ListPages.*` i18n namespace

**Files:**
- Modify: `src/config/messages/{en,fr}.json`

Add a new `ListPages` top-level key with reusable filter and label strings:

```json
"ListPages": {
  "filters": {
    "sectors": "Sectors",
    "segments": "Segments",
    "verification": "Verification",
    "country": "Country",
    "category": "Category",
    "tags": "Tags",
    "region": "Region",
    "deadline": "Deadline",
    "any": "Any",
    "reset": "Reset filters"
  },
  "results": {
    "title": "Results",
    "empty": "No results match your filters."
  },
  "rfqCta": "Send an RFQ to every verified company on this page"
}
```

FR equivalents:
- filters.sectors → "Secteurs"; segments → "Segments"; verification → "Vérification"; country → "Pays"; category → "Catégorie"; tags → "Étiquettes"; region → "Région"; deadline → "Date limite"; any → "Tous"; reset → "Réinitialiser les filtres"
- results.title → "Résultats"; empty → "Aucun résultat ne correspond à vos filtres."
- rfqCta → "Envoyer un RFQ à toutes les entreprises vérifiées de cette page"

---

## Task 2: Shared sidebar filter primitives

**Files:**
- Create: `src/components/list-pages/sectors-filter.tsx`
- Create: `src/components/list-pages/segments-filter.tsx`
- Create: `src/components/list-pages/verification-filter.tsx`
- Create: `src/components/list-pages/active-filters-bar.tsx`

### `sectors-filter.tsx` (async server)

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FilterGroup, FilterItem } from "@/components/design";

interface Sector { id: string; name_en: string; name_fr: string; }

export async function SectorsFilter({ locale, activeId, basePath }: {
  locale: string;
  activeId?: string;
  basePath: string;
}) {
  const t = await getTranslations({ locale, namespace: "ListPages.filters" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("sectors").select("id, name_en, name_fr").order("name_en");
  const sectors = ((data ?? []) as unknown as Sector[]);
  return (
    <FilterGroup label={t("sectors")}>
      <FilterItem label={t("any")} href={basePath} active={!activeId} />
      {sectors.map((s) => (
        <FilterItem
          key={s.id}
          label={locale === "fr" ? s.name_fr : s.name_en}
          href={`${basePath}?sector=${s.id}`}
          active={activeId === s.id}
        />
      ))}
    </FilterGroup>
  );
}
```

### `segments-filter.tsx` (client — uses SEGMENT_KEYS from S4)

```tsx
"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import { FilterGroup, FilterItem } from "@/components/design";

export function SegmentsFilter({ activeSegment, basePath }: {
  activeSegment?: string;
  basePath: string;
}) {
  const t = useTranslations("ListPages.filters");
  const tSeg = useTranslations("Market.segments");
  return (
    <FilterGroup label={t("segments")}>
      <FilterItem label={t("any")} href={basePath} active={!activeSegment} />
      {SEGMENT_KEYS.map((s) => (
        <FilterItem key={s} label={tSeg(s)} href={`${basePath}?segment=${s}`} active={activeSegment === s} />
      ))}
    </FilterGroup>
  );
}
```

(Note: `FilterItem` href is a plain string, not the locale-aware `Link`. That's fine because the sidebar lives on a locale-prefixed page; `basePath` should be passed WITH the locale by the page.)

### `verification-filter.tsx` (client)

```tsx
"use client";
import { useTranslations } from "next-intl";
import { FilterGroup, FilterItem } from "@/components/design";

const TIERS = ["any", "verified", "premium", "basic", "none"] as const;

export function VerificationFilter({ activeTier, basePath }: {
  activeTier?: string;
  basePath: string;
}) {
  const t = useTranslations("ListPages.filters");
  const tBadge = useTranslations("Trust.badge");
  return (
    <FilterGroup label={t("verification")}>
      {TIERS.map((tier) => {
        const label = tier === "any" ? t("any") : tBadge(tier);
        const href = tier === "any" ? basePath : `${basePath}?tier=${tier}`;
        const active = (activeTier ?? "any") === tier;
        return <FilterItem key={tier} label={label} href={href} active={active} />;
      })}
    </FilterGroup>
  );
}
```

### `active-filters-bar.tsx` (client)

```tsx
"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterChip } from "@/components/design";

const ALLOWED_KEYS = ["sector", "segment", "tier", "category", "region", "tag", "country"];

export function ActiveFiltersBar({ labels }: { labels: Record<string, string> }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const t = useTranslations("ListPages.filters");
  const entries = Array.from(sp.entries()).filter(([k]) => ALLOWED_KEYS.includes(k));
  if (entries.length === 0) return null;
  function remove(key: string) {
    const next = new URLSearchParams(sp.toString());
    next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }
  function resetAll() {
    router.push(path);
  }
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {entries.map(([k, v]) => (
        <FilterChip key={k} label={labels[k] ?? k} value={v} onRemove={() => remove(k)} />
      ))}
      <button type="button" onClick={resetAll} className="text-xs underline text-muted-foreground">
        {t("reset")}
      </button>
    </div>
  );
}
```

---

## Task 3: Reskin `/companies/page.tsx`

**Files:**
- Modify: `src/app/[locale]/companies/page.tsx`

The current file (per recon: client component using TanStack Query + a sidebar of filters and a grid of cards). Replace its rendered tree with the design-system primitives **while keeping its data-fetching logic and React Query**. Steps:

- [ ] **Step 1: Read** the current file fully so the reskin preserves all existing query state + filters.

- [ ] **Step 2: Refactor:** the page stays a client component (it has `useState` + `useQuery`). Replace the visual layer:
  - Wrap content in `<ListPageShell sidebar={<FilterSidebar>…</FilterSidebar>}>`.
  - Inside sidebar: `<SectorsFilter>` (server — but inside a client component the import won't work; instead build a **client variant** of SectorsFilter that takes a `sectors` prop from a server parent — OR keep `companies/page.tsx` as a server component and lift state to URL params).
  - Actually: simpler path — convert the page to a SERVER component that reads `searchParams`, fetches matching rows from Supabase server-side, and renders. Drop TanStack Query for `/companies`. This is a significant change but matches every other page in this phase.

- [ ] **Step 3:** New page outline (server component):

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ListPageShell, FilterSidebar, PageHeader, RfqCtaBanner, CompanyRow, EmptyState,
} from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { SegmentsFilter } from "@/components/list-pages/segments-filter";
import { VerificationFilter } from "@/components/list-pages/verification-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";
import { Link } from "@/i18n/routing";

interface CompanyRow {
  id: string; name: string; logo_url: string | null; description: string | null;
  verification_tier: string | null;
}

export default async function CompaniesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "ListPages" });
  const tNav = await getTranslations({ locale, namespace: "Companies" }).catch(() => null);
  const supabase = await createServerSupabaseClient();

  const basePath = `/${locale}/companies`;
  const sectorId = sp.sector;
  const segment = sp.segment;
  const tier = sp.tier;

  // Two-step if segment is set; otherwise direct query.
  let q = supabase
    .from("companies")
    .select("id, name, logo_url, description, verification_tier", segment ? { count: "exact" } : undefined)
    .eq("status", "verified")
    .order("name", { ascending: true });
  if (sectorId) q = q.eq("sector_id", sectorId);
  if (tier && tier !== "any") q = q.eq("verification_tier", tier);

  if (segment) {
    const { data: rel } = await supabase.from("company_segments").select("company_id").eq("segment_key", segment);
    const ids = (rel ?? []).map((r: { company_id: string }) => r.company_id);
    if (ids.length === 0) q = q.in("id", ["00000000-0000-0000-0000-000000000000"]);
    else q = q.in("id", ids);
  }

  const { data } = await q;
  const rows = ((data ?? []) as unknown as CompanyRow[]);

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sectorId} basePath={basePath} />
          <SegmentsFilter activeSegment={segment} basePath={basePath} />
          <VerificationFilter activeTier={tier} basePath={basePath} />
        </FilterSidebar>
      }
    >
      <PageHeader
        title={tNav ? tNav("title") : "Companies"}
        subtitle={tNav ? tNav("subtitle") : undefined}
      />
      <div className="my-4">
        <RfqCtaBanner
          title={t("rfqCta")}
          action={<Link href="/dashboard/opportunities/new" className="text-sm bg-white text-primary px-3 py-1.5 rounded-md font-medium">RFQ</Link>}
        />
      </div>
      <ActiveFiltersBar labels={{ sector: t("filters.sectors"), segment: t("filters.segments"), tier: t("filters.verification") }} />
      {rows.length === 0 ? (
        <EmptyState title={t("results.empty")} />
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <CompanyRow
              key={c.id}
              company={{
                id: c.id,
                name: c.name,
                logo_url: c.logo_url,
                description: c.description,
                verification_tier: (c.verification_tier ?? "none") as "none" | "basic" | "verified" | "premium",
                tags: [],
              }}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
```

Adapt translation lookups to whatever the existing `Companies` namespace actually has (S4 may have it). Use safe `.catch(() => null)` to avoid crashing on missing keys; default English fallback when the namespace isn't there.

---

## Task 4: Reskin `/products/page.tsx`

Per recon, the current products page uses static mock data. Adapt to the design-system shell anyway — it will be wired to real data in a future slice once products are seeded.

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ListPageShell, FilterSidebar, PageHeader, ProductCardDesign, EmptyState,
} from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

interface ProductRow {
  id: string; name: string; image_url?: string | null;
  company_id: string;
  companies?: { name: string; verification_tier: string | null } | null;
}

export default async function ProductsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "ListPages" });
  const basePath = `/${locale}/products`;
  const supabase = await createServerSupabaseClient();

  let q = supabase
    .from("products")
    .select("id, name, image_url, company_id, companies(name, verification_tier, status)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (sp.sector) q = q.eq("companies.sector_id", sp.sector);
  const { data } = await q;
  const rows = ((data ?? []) as unknown as ProductRow[]).filter(p => p.companies);

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={basePath} />
        </FilterSidebar>
      }
    >
      <PageHeader title="Products" />
      <ActiveFiltersBar labels={{ sector: t("filters.sectors") }} />
      {rows.length === 0 ? (
        <EmptyState title={t("results.empty")} />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => (
            <ProductCardDesign
              key={p.id}
              item={{
                id: p.id,
                name: p.name,
                image_url: p.image_url ?? null,
                company_id: p.company_id,
                company_name: p.companies?.name ?? null,
              }}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
```

---

## Task 5: Reskin `/opportunities/page.tsx`

The S5 list already mostly works. Tighten to the design system:

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ListPageShell, FilterSidebar, FilterGroup, FilterItem,
  PageHeader, OpportunityCardDesign, EmptyState, FeaturedOpportunityStrip,
} from "@/components/design";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";
import { listPublished } from "@/lib/opportunities/queries";
import { OPPORTUNITY_CATEGORIES, isOpportunityCategory } from "@/lib/opportunities/categories";

export default async function OpportunitiesPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const basePath = `/${locale}/opportunities`;
  const supabase = await createServerSupabaseClient();
  const active = sp.category && isOpportunityCategory(sp.category) ? sp.category : undefined;
  const featured = await listPublished(supabase, { limit: 5 });
  const items = await listPublished(supabase, { category: active, limit: 60 });

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <FilterGroup label={tList("filters.category")}>
            <FilterItem label={tList("filters.any")} href={basePath} active={!active} />
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <FilterItem key={c} label={t(`categories.${c}`)} href={`${basePath}?category=${c}`} active={active === c} />
            ))}
          </FilterGroup>
        </FilterSidebar>
      }
    >
      <PageHeader title={t("page.title")} subtitle={t("page.subtitle")} />
      <div className="my-4">
        <FeaturedOpportunityStrip items={featured} locale={locale} />
      </div>
      <ActiveFiltersBar labels={{ category: tList("filters.category") }} />
      {items.length === 0 ? (
        <EmptyState title={t("page.empty")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((o) => <OpportunityCardDesign key={o.id} item={o} locale={locale} />)}
        </div>
      )}
    </ListPageShell>
  );
}
```

---

## Task 6: Reskin Marketplace pages

### `/market/page.tsx` (landing)

Reuse the 8-segment tile grid pattern from S4 but use new tokens:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import { SegmentShelf } from "@/components/marketplace/segment-shelf";

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Market" });
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <PageHeader title={t("page.title")} subtitle={t("page.subtitle")} />
      {SEGMENT_KEYS.map((seg) => (
        <section key={seg} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">{t(`segments.${seg}`)}</h2>
            <Link href={`/market/${seg}`} className="text-xs underline text-muted-foreground">
              {t("page.viewAll")}
            </Link>
          </div>
          <SegmentShelf segment={seg} />
        </section>
      ))}
    </div>
  );
}
```

### `/market/[segment]/page.tsx`

Use the design `ListPageShell`:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSegmentKey } from "@/lib/marketplace/segments";
import { ListPageShell, FilterSidebar, PageHeader, CompanyRow, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { VerificationFilter } from "@/components/list-pages/verification-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

interface Row {
  company_id: string;
  companies: { id: string; name: string; logo_url: string | null; description: string | null; verification_tier: string | null; status: string } | null;
}

export default async function SegmentListPage({
  params, searchParams,
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
  const { data } = await supabase
    .from("company_segments")
    .select("company_id, companies(id, name, logo_url, description, verification_tier, status)")
    .eq("segment_key", segment);
  const rows = ((data ?? []) as unknown as Row[]).filter(r => r.companies && r.companies.status === "verified");

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={basePath} />
          <VerificationFilter activeTier={sp.tier} basePath={basePath} />
        </FilterSidebar>
      }
    >
      <PageHeader title={t(`segments.${segment}`)} subtitle={t("page.subtitle")} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors"), tier: tList("filters.verification") }} />
      {rows.length === 0 ? (
        <EmptyState title={tList("results.empty")} />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <CompanyRow
              key={r.company_id}
              company={{
                id: r.companies!.id,
                name: r.companies!.name,
                logo_url: r.companies!.logo_url,
                description: r.companies!.description,
                verification_tier: (r.companies!.verification_tier ?? "none") as "none"|"basic"|"verified"|"premium",
                tags: [],
              }}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
```

---

## Task 7: Reskin News / Events / Blog list pages

For each of `/news`, `/events`, `/blog`:

- Replace the current outer container with `<ListPageShell sidebar=…>`.
- Sidebar: `<SectorsFilter>` (for filtering by sector_id if the content has one).
- Add `<PageHeader>` + `<ActiveFiltersBar>`.
- Keep `<ContentCard>` (S3) — it already matches the new style.
- Events list keeps the date-sorted custom query (S3).

Pattern (use for all three, swap `type` and namespace):

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listPublished } from "@/lib/content/queries";
import { ContentCard } from "@/components/content/content-card";
import { ListPageShell, FilterSidebar, PageHeader, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

export default async function NewsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Content.news" });
  const tList = await getTranslations({ locale, namespace: "ListPages" });
  const supabase = await createServerSupabaseClient();
  const items = await listPublished(supabase, "news", { limit: 50 });

  return (
    <ListPageShell
      sidebar={
        <FilterSidebar>
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={`/${locale}/news`} />
        </FilterSidebar>
      }
    >
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors") }} />
      {items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="grid gap-3">
          {items.map((i) => <ContentCard key={i.id} item={i} locale={locale} />)}
        </div>
      )}
    </ListPageShell>
  );
}
```

Repeat for events (custom event_start_at sort — keep current query) and blog (same shape, namespace `Content.blog`).

---

## Task 8: Reskin Data Hub list pages

### `/data-hub/reports/[kind]/page.tsx`

```tsx
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
  params, searchParams,
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
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={`/${locale}/data-hub/reports/${kind}`} />
        </FilterSidebar>
      }
    >
      <PageHeader title={t(`pillars.${kind}.title`)} subtitle={t(`pillars.${kind}.body`)} />
      <ActiveFiltersBar labels={{ sector: tList("filters.sectors") }} />
      {items.length === 0 ? (
        <EmptyState title={t("list.empty")} />
      ) : (
        <div className="grid gap-3">
          {items.map((r) => <ReportCard key={r.id} item={r} locale={locale} />)}
        </div>
      )}
    </ListPageShell>
  );
}
```

### `/data-hub/prices/page.tsx`

Same pattern with `SectorsFilter`. Cards: keep the existing series row link (compact `<li>` rows already work).

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSeries } from "@/lib/data-hub/queries";
import { Link } from "@/i18n/routing";
import { ListPageShell, FilterSidebar, PageHeader, EmptyState } from "@/components/design";
import { SectorsFilter } from "@/components/list-pages/sectors-filter";
import { ActiveFiltersBar } from "@/components/list-pages/active-filters-bar";

export default async function PricesListPage({ params, searchParams }: {
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
          <SectorsFilter locale={locale} activeId={sp.sector} basePath={`/${locale}/data-hub/prices`} />
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
              <Link href={`/data-hub/prices/${s.id}`} className="block border rounded-md p-3 bg-card hover:bg-muted/40 text-sm">
                <span className="font-medium">{locale === "fr" ? s.commodity_fr : s.commodity_en}</span>
                <span className="text-muted-foreground ml-2 text-xs">{s.currency}/{s.unit}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListPageShell>
  );
}
```

---

## Task 9: Verify + ship-wreck + commit

- `npx vitest run` — 24 tests still pass (no new tests in Phase 3).
- `npm run build` — clean.
- `npx eslint --quiet src/components/list-pages/ src/app/[locale]/companies/page.tsx src/app/[locale]/products/page.tsx src/app/[locale]/opportunities/page.tsx 'src/app/[locale]/market/page.tsx' 'src/app/[locale]/market/[segment]/page.tsx' 'src/app/[locale]/news/page.tsx' 'src/app/[locale]/events/page.tsx' 'src/app/[locale]/blog/page.tsx' 'src/app/[locale]/data-hub/reports/[kind]/page.tsx' 'src/app/[locale]/data-hub/prices/page.tsx'` — no errors.
- Orchestrator runs ship-wreck-check.
- Single commit on `main`.

---

## Self-Review

- **Spec coverage:** DESIGN.md §3.2 (Companies) → T3; §3.4 (Products) → T4; §3.6 (Opportunities) → T5; §3.8 (Marketplace) → T6; §3.10 (News/Events/Blog) → T7; §3.11 (Data Hub lists) → T8. All consistent with primitives from Phase 1.
- **No placeholders:** every page has executable code.
- **Type consistency:** `<CompanyRow>` accepts `verification_tier: "none"|"basic"|"verified"|"premium"` — every consumer casts to that union. `<OpportunityCardDesign>` receives the typed `Opportunity` from `@/lib/opportunities/types`. `<ProductCardDesign>` and `<ReportCard>` accept their own typed inputs.

## Done definition

- All 10 page files reskinned to the design system.
- ListPages.* i18n landed in both locales.
- 4 shared sidebar filter components created.
- 24/24 tests; build/lint clean; commit on `main`.
