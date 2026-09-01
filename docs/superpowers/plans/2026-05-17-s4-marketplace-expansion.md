# S4 — Marketplace Expansion (Services + Segments)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Promote the marketplace from a product-only catalog into a real segmented marketplace. Add `services` parallel to `products`, tag every company with one or more segments (manufacturer / importer / exporter / finance / logistics / government / public_corp / facilitation), and ship a `/market` landing page with per-segment shelves.

**Architecture:**
- New `services` table mirroring `products` (no `images[]`; adds `service_type`, `delivery_mode`).
- New `company_segments` join table (`company_id`, `segment_key`).
- New `segments` reference table with bilingual labels (seeded via the migration).
- `/market` landing page = per-segment shelves; `/market/[segment]` = filtered companies/services list.
- `/companies` gets segment + verification-tier filters.
- Company profile gets a tabbed display: Overview / Products / Services / Segments.

**Tech Stack:** Next.js 16 App Router, Supabase, next-intl, shadcn/ui, Vitest (already installed).

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §6 (S4).

**No commits per task** — orchestrator runs verify + ship-wreck + single commit on `main`.

---

## File Structure

**Create:**
- `supabase/migrations/00006_marketplace_segments.sql` — `segments` ref table + seed, `company_segments` join, `services` table.
- `src/lib/marketplace/types.ts` — `SegmentKey`, `Service`, `CompanySegment` types.
- `src/lib/marketplace/segments.ts` — canonical segment list + utilities.
- `src/lib/marketplace/segments.test.ts` — unit test for the canonical list shape.
- `src/components/marketplace/segment-badge.tsx` — small chip rendering a segment with icon + i18n label.
- `src/components/marketplace/segment-shelf.tsx` — list of companies for a given segment (server component).
- `src/components/marketplace/segment-filter-bar.tsx` — client filter bar (segment + sector + verification tier).
- `src/app/[locale]/market/page.tsx` — landing with shelves.
- `src/app/[locale]/market/[segment]/page.tsx` — segment listing.
- `src/app/[locale]/admin/segments/page.tsx` — read-only admin view of the canonical segments (just lists them; segments are seeded, not user-managed in this slice).

**Modify:**
- `src/app/[locale]/companies/page.tsx` — add segment filter + verification tier filter.
- `src/app/[locale]/companies/[id]/page.tsx` — render segments + services tabs alongside existing content.
- `src/app/[locale]/admin/companies/[id]/page.tsx` — admin can edit which segments a company has (multi-select).
- `src/config/messages/en.json` + `fr.json` — `Market.*` namespace with segment labels.
- `src/config/navigation.ts` — add `Market` top-level entry.
- `supabase/migrations/CLAUDE.md` — bump "next free" to 00007.

---

## Canonical segment list (locked)

```ts
export const SEGMENT_KEYS = [
  "manufacturer",
  "importer",
  "exporter",
  "finance",
  "logistics",
  "government",
  "public_corp",
  "facilitation",
] as const;
export type SegmentKey = typeof SEGMENT_KEYS[number];
```

The migration seeds these eight rows in `segments` with bilingual labels.

---

## Task 1: Migration `00006_marketplace_segments.sql`

**Files:**
- Create: `supabase/migrations/00006_marketplace_segments.sql`

- [ ] **Step 1: Read** 00001, 00004, 00005 to match style and confirm `public.touch_updated_at` + `public.is_admin` exist.

- [ ] **Step 2: Write**

```sql
-- 00006_marketplace_segments.sql
-- Marketplace expansion: canonical segments, company-segment join, services table.

-- Canonical segments (reference table, seeded below).
CREATE TABLE IF NOT EXISTS public.segments (
  key text PRIMARY KEY CHECK (key IN (
    'manufacturer','importer','exporter','finance',
    'logistics','government','public_corp','facilitation'
  )),
  name_en text NOT NULL,
  name_fr text NOT NULL,
  description_en text,
  description_fr text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments_public_read" ON public.segments FOR SELECT USING (true);
CREATE POLICY "segments_admin_write" ON public.segments
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.segments (key, name_en, name_fr, sort_order) VALUES
  ('manufacturer',  'Manufacturers',           'Fabricants',                  1),
  ('importer',      'Importers',               'Importateurs',                2),
  ('exporter',      'Exporters',               'Exportateurs',                3),
  ('finance',       'Finance & Banking',       'Finance et banque',           4),
  ('logistics',     'Logistics & Shipping',    'Logistique et transport',     5),
  ('government',    'Government bodies',       'Organismes publics',          6),
  ('public_corp',   'Public corporations',     'Entreprises publiques',       7),
  ('facilitation',  'Trade facilitation',      'Facilitation commerciale',    8)
ON CONFLICT (key) DO UPDATE
  SET name_en = EXCLUDED.name_en,
      name_fr = EXCLUDED.name_fr,
      sort_order = EXCLUDED.sort_order;

-- Company ↔ segment join.
CREATE TABLE IF NOT EXISTS public.company_segments (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  segment_key text NOT NULL REFERENCES public.segments(key) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, segment_key)
);

ALTER TABLE public.company_segments ENABLE ROW LEVEL SECURITY;
-- Public read if the parent company is verified (consistent with companies_public_read rules).
CREATE POLICY "company_segments_public_read" ON public.company_segments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.status = 'verified')
  );
CREATE POLICY "company_segments_owner_write" ON public.company_segments
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS company_segments_segment_idx
  ON public.company_segments (segment_key);

-- Services (mirrors products but for non-physical offerings).
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_fr text NOT NULL,
  description_en text,
  description_fr text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  service_type text NOT NULL DEFAULT 'consulting'
    CHECK (service_type IN ('consulting','logistics','finance','legal','custom','other')),
  delivery_mode text NOT NULL DEFAULT 'on_request'
    CHECK (delivery_mode IN ('on_request','subscription','one_off','retainer')),
  price_indication_en text,
  price_indication_fr text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_public_read_active_verified" ON public.services
  FOR SELECT USING (
    status = 'active' AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.status = 'verified'
    )
  );
CREATE POLICY "services_owner_all" ON public.services
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR (
      public.is_email_verified() AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.owner_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS services_company_idx ON public.services (company_id);
CREATE INDEX IF NOT EXISTS services_status_idx ON public.services (status);

DROP TRIGGER IF EXISTS services_updated ON public.services;
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

- [ ] **Step 3:** Do NOT apply. Project remains paused.

---

## Task 2: Marketplace types + canonical segment list (TDD)

**Files:**
- Create: `src/lib/marketplace/types.ts`
- Create: `src/lib/marketplace/segments.ts`
- Create: `src/lib/marketplace/segments.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { SEGMENT_KEYS, isSegmentKey, segmentSortIndex } from "./segments";

describe("segments", () => {
  it("exposes exactly 8 canonical segments in roadmap order", () => {
    expect(SEGMENT_KEYS).toEqual([
      "manufacturer","importer","exporter","finance",
      "logistics","government","public_corp","facilitation",
    ]);
  });
  it("isSegmentKey accepts valid keys and rejects others", () => {
    expect(isSegmentKey("manufacturer")).toBe(true);
    expect(isSegmentKey("nonsense")).toBe(false);
  });
  it("segmentSortIndex returns position in canonical list", () => {
    expect(segmentSortIndex("manufacturer")).toBe(0);
    expect(segmentSortIndex("facilitation")).toBe(7);
  });
});
```

Run: `npx vitest run src/lib/marketplace/segments.test.ts` → FAIL.

- [ ] **Step 2: Implement**

`src/lib/marketplace/segments.ts`:
```ts
export const SEGMENT_KEYS = [
  "manufacturer",
  "importer",
  "exporter",
  "finance",
  "logistics",
  "government",
  "public_corp",
  "facilitation",
] as const;
export type SegmentKey = typeof SEGMENT_KEYS[number];

export function isSegmentKey(value: unknown): value is SegmentKey {
  return typeof value === "string" && (SEGMENT_KEYS as readonly string[]).includes(value);
}

export function segmentSortIndex(key: SegmentKey): number {
  return SEGMENT_KEYS.indexOf(key);
}
```

`src/lib/marketplace/types.ts`:
```ts
import type { SegmentKey } from "./segments";

export interface Segment {
  key: SegmentKey;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  sort_order: number;
}

export interface CompanySegment {
  company_id: string;
  segment_key: SegmentKey;
}

export type ServiceType = "consulting" | "logistics" | "finance" | "legal" | "custom" | "other";
export type ServiceDeliveryMode = "on_request" | "subscription" | "one_off" | "retainer";
export type ServiceStatus = "active" | "paused" | "archived";

export interface Service {
  id: string;
  company_id: string;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  category_id: string | null;
  service_type: ServiceType;
  delivery_mode: ServiceDeliveryMode;
  price_indication_en: string | null;
  price_indication_fr: string | null;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}
```

Run vitest → 13 tests pass (10 prior + 3 new).

---

## Task 3: Marketplace i18n namespace

**Files:**
- Modify: `src/config/messages/en.json`
- Modify: `src/config/messages/fr.json`

- [ ] **Step 1:** Read both, merge under a new top-level `Market` key.

EN:
```json
"Market": {
  "navLabel": "Marketplace",
  "page": {
    "title": "Marketplace",
    "subtitle": "Browse Congolese companies by what they do.",
    "viewAll": "View all"
  },
  "segments": {
    "manufacturer": "Manufacturers",
    "importer": "Importers",
    "exporter": "Exporters",
    "finance": "Finance & Banking",
    "logistics": "Logistics & Shipping",
    "government": "Government bodies",
    "public_corp": "Public corporations",
    "facilitation": "Trade facilitation"
  },
  "filters": {
    "segment": "Segment",
    "sector": "Sector",
    "verificationTier": "Verification",
    "any": "Any",
    "reset": "Reset filters"
  },
  "companyProfile": {
    "tabsOverview": "Overview",
    "tabsProducts": "Products",
    "tabsServices": "Services",
    "tabsSegments": "Segments",
    "noServices": "No services listed yet.",
    "noSegments": "No segments tagged yet."
  }
}
```

FR (translate, same shape — keep keys identical).

---

## Task 4: Segment badge component

**Files:**
- Create: `src/components/marketplace/segment-badge.tsx`

- [ ] **Step 1: Read** `src/components/trust/verification-badge.tsx` to match style density.

- [ ] **Step 2: Implement**

```tsx
"use client";
import { useTranslations } from "next-intl";
import { Factory, Truck, Globe, Banknote, Landmark, Building, Briefcase, ShipWheel } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentKey } from "@/lib/marketplace/segments";

const iconBySegment: Record<SegmentKey, React.ElementType> = {
  manufacturer: Factory,
  importer: Truck,
  exporter: Globe,
  finance: Banknote,
  logistics: ShipWheel,
  government: Landmark,
  public_corp: Building,
  facilitation: Briefcase,
};

export function SegmentBadge({ segment, className }: { segment: SegmentKey; className?: string }) {
  const t = useTranslations("Market.segments");
  const Icon = iconBySegment[segment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full bg-muted text-foreground",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {t(segment)}
    </span>
  );
}
```

---

## Task 5: `/market` landing page

**Files:**
- Create: `src/app/[locale]/market/page.tsx`
- Create: `src/components/marketplace/segment-shelf.tsx`

- [ ] **Step 1:** Read an existing index page that lists DB-backed cards (e.g. `src/app/[locale]/companies/page.tsx`) for the project's preferred layout.

- [ ] **Step 2: SegmentShelf (server component)**

```tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SegmentKey } from "@/lib/marketplace/segments";
import { Link } from "@/i18n/routing";

type ShelfRow = { company_id: string; companies: { id: string; name: string; verification_tier: string | null } | null };

export async function SegmentShelf({
  segment,
  locale,
  limit = 6,
}: {
  segment: SegmentKey;
  locale: string;
  limit?: number;
}) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("company_segments")
    .select("company_id, companies(id, name, verification_tier)")
    .eq("segment_key", segment)
    .limit(limit);
  const rows = ((data ?? []) as unknown as ShelfRow[]).filter(r => r.companies);
  if (rows.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{/* title via translations in parent */}</h2>
        <Link href={`/market/${segment}`} className="text-sm underline text-muted-foreground">
          View all
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((r) => (
          <Link key={r.company_id} href={`/companies/${r.company_id}`} className="border rounded-md p-3 bg-card hover:bg-muted/40 text-sm">
            {r.companies!.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

Actually move the heading + "View all" into the page (because the title needs translations and SegmentShelf is a server child). Simpler: make the page own the heading and "View all", and SegmentShelf only returns the grid.

Refactor SegmentShelf to just return the grid (no heading). The landing page handles the heading per shelf.

- [ ] **Step 3: Landing page**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import { SegmentShelf } from "@/components/marketplace/segment-shelf";

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Market" });
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t("page.title")}</h1>
      <p className="text-muted-foreground mb-8">{t("page.subtitle")}</p>
      {SEGMENT_KEYS.map((seg) => (
        <section key={seg} className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t(`segments.${seg}`)}</h2>
            <Link href={`/market/${seg}`} className="text-sm underline text-muted-foreground">
              {t("page.viewAll")}
            </Link>
          </div>
          {/* @ts-expect-error Server Component */}
          <SegmentShelf segment={seg} locale={locale} />
        </section>
      ))}
    </main>
  );
}
```

(The `@ts-expect-error` comment may not be needed if Next 16 handles async server components inline; if it complains, leave the directive in. If the build is clean without it, drop it.)

---

## Task 6: `/market/[segment]` filtered list

**Files:**
- Create: `src/app/[locale]/market/[segment]/page.tsx`

- [ ] **Step 1:** Validate `segment` param via `isSegmentKey`; `notFound()` otherwise.

- [ ] **Step 2:** Query `company_segments` joined with `companies` for that segment, render a denser grid with name, sector, verification badge (S2). Reuse `VerificationBadge`.

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSegmentKey } from "@/lib/marketplace/segments";
import { VerificationBadge } from "@/components/trust/verification-badge";
import type { VerificationTier } from "@/lib/trust/types";
import { Link } from "@/i18n/routing";

export default async function SegmentListPage({
  params,
}: {
  params: Promise<{ locale: string; segment: string }>;
}) {
  const { locale, segment } = await params;
  if (!isSegmentKey(segment)) notFound();
  const t = await getTranslations({ locale, namespace: "Market" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("company_segments")
    .select("company_id, companies(id, name, sector_id, verification_tier, status)")
    .eq("segment_key", segment);
  const rows = ((data ?? []) as unknown as Array<{ company_id: string; companies: { id: string; name: string; verification_tier: string | null; status: string } | null }>).filter(r => r.companies && r.companies.status === "verified");
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <p className="text-xs text-muted-foreground mb-2">
        <Link href="/market" className="underline">{t("page.title")}</Link>
        <span className="mx-2">/</span>
      </p>
      <h1 className="text-2xl font-semibold mb-6">{t(`segments.${segment}`)}</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((r) => (
          <Link key={r.company_id} href={`/companies/${r.companies!.id}`} className="border rounded-md p-3 bg-card hover:bg-muted/40">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{r.companies!.name}</span>
              <VerificationBadge tier={(r.companies!.verification_tier ?? "none") as VerificationTier} />
            </div>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
      </div>
    </main>
  );
}
```

---

## Task 7: Companies filter bar

**Files:**
- Create: `src/components/marketplace/segment-filter-bar.tsx`
- Modify: `src/app/[locale]/companies/page.tsx`

- [ ] **Step 1: Filter bar (client component)**

URL-driven (push state via `useRouter` + `useSearchParams`). Three selects: segment, sector, verification tier. Sectors are fetched server-side and passed in as a prop list.

- [ ] **Step 2: Companies page**

Read existing companies/page.tsx fully. Add:
- Server fetch of sectors and segments at top of the page.
- A `<SegmentFilterBar sectors={...} initialSegment={...} initialSector={...} initialTier={...} />` above the grid.
- Companies query joined with `company_segments` filtered by URL params:
  - `segment` filter: `.in("id", subquery_company_ids_for_segment)` — practically: do a two-step fetch (segment → company_ids → companies where id IN those) since Supabase JS doesn't compose subqueries cleanly. Acceptable for slice 1.

If the page is large/complex, keep changes additive. Don't refactor the whole file.

---

## Task 8: Company profile tabs

**Files:**
- Modify: `src/app/[locale]/companies/[id]/page.tsx`

- [ ] **Step 1: Read** the current company detail page (already modified in S2).

- [ ] **Step 2:** Add four tabs (use shadcn `Tabs` if present): Overview / Products / Services / Segments. The Overview tab keeps the existing content. Products lists products from the current query. Services queries `services` table for this company (active only). Segments shows the segment badges.

Use the `<SegmentBadge>` component (T4) in Segments tab, and `<VerificationBadge>` already present.

---

## Task 9: Admin segment editor for a company

**Files:**
- Modify: `src/app/[locale]/admin/companies/[id]/page.tsx`
- Create: `src/app/[locale]/admin/companies/[id]/segments-form.tsx`

- [ ] **Step 1: Read** the existing admin company detail page (S2 added the trust-profile-form there).

- [ ] **Step 2: SegmentsForm (client)**

Eight checkboxes — one per segment key. Pre-checked from current `company_segments` rows. Save handler:
1. Compute additions (now-checked, not in current) and removals (now-unchecked, in current).
2. `supabase.from("company_segments").delete().eq("company_id", id).in("segment_key", removals)` if removals.
3. `supabase.from("company_segments").insert(additions.map(s => ({ company_id: id, segment_key: s })))` if additions.
4. Toast success.

Add a "Segments" section to the admin company page that mounts this form, similar to the trust profile section.

---

## Task 10: Nav entry + verify + commit

**Files:**
- Modify: `src/config/navigation.ts`
- Final verification.

- [ ] **Step 1: Nav** — add `{ title: "Marketplace", href: "/market", icon: Store }` as a top-level entry (import `Store` from lucide-react).

- [ ] **Step 2:** `npx vitest run` — 13 tests pass.

- [ ] **Step 3:** `npm run build` — clean.

- [ ] **Step 4:** `npx eslint --quiet <S4 touched files>` — no errors.

- [ ] **Step 5:** Orchestrator runs ship-wreck-check and commits.

---

## Self-Review

- **Spec coverage:** §6 master roadmap — services table (T1), segments + join (T1), `/market` landing (T5), `/market/[segment]` (T6), filter on companies (T7), profile tabs (T8), admin segment editor (T9), nav (T10).
- **YAGNI:** No product detail changes, no service detail page (services land on company profile and segment list only; dedicated detail can come in a future slice).
- **No placeholders:** all tasks have code + acceptance criteria.

## Done definition

- 13+ tests pass; build/lint clean.
- Migration 00006 file committed (apply behind 00003/00004/00005).
- `/market` and `/market/<segment>` reachable bilingually.
- Companies page has working segment/sector/tier filters.
- Company profile has Overview/Products/Services/Segments tabs.
- Admins can toggle a company's segment memberships from the admin panel.
