# S7 — Global Search (Cmd+K + /search)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) syntax.

**Goal:** Ship cross-entity search. A Cmd+K palette pops anywhere in the app and shows ranked results from companies, products, services, opportunities, content_items, reports. A dedicated `/search?q=` results page mirrors the palette with facets and pagination.

**Architecture:** Use Postgres-native full-text search (no separate search service). Each searchable table gets a generated `tsvector` column over its EN + FR title/body fields, plus a GIN index. Search runs a single SQL function `public.global_search(q text, lang text)` that returns a union of typed result rows. Frontend palette debounces input and fetches via RPC.

**Tech Stack:** Next.js 16, Supabase RPC, next-intl, shadcn/ui Command + Dialog, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §9 (S7).

**No commits per task** — orchestrator runs verify + ship-wreck + single commit.

---

## File Structure

**Create:**
- `supabase/migrations/00009_global_search.sql` — `tsvector` columns + triggers + indexes + `global_search()` RPC.
- `src/lib/search/types.ts` — `SearchResult`, `SearchEntityType`.
- `src/lib/search/rank.ts` + `rank.test.ts` — pure helper to bucket/sort results by entity type with tie-breakers, with TDD coverage.
- `src/lib/search/api.ts` — `runGlobalSearch(supabase, query, locale)` wrapper around the RPC.
- `src/components/search/command-palette.tsx` — Cmd+K dialog (client).
- `src/components/search/result-item.tsx` — single result row.
- `src/app/[locale]/search/page.tsx` — results page (Server Component) supporting `?q=` + `?type=` facet.

**Modify:**
- `src/lib/search/search-context.tsx` — already exists; integrate the new `command-palette` (open/close state, hotkey).
- `src/app/[locale]/layout.tsx` — mount `<CommandPalette />` at the layout level (Suspense-wrapped).
- `src/config/messages/en.json` + `fr.json` — `Search.*` namespace.
- `src/config/navigation.ts` — optional: top nav icon entry for search (or leave it palette-only).
- `supabase/migrations/CLAUDE.md` — bump to 00010.

---

## Task 1: Migration `00009_global_search.sql`

```sql
-- 00009_global_search.sql
-- Adds tsvector columns + GIN indexes on searchable tables, plus a SQL RPC
-- `public.global_search(q, lang)` that returns a typed union of results.

-- ---------- COMPANIES ----------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.companies_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english', COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  NEW.search_fr := to_tsvector('french',  COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS companies_search_refresh ON public.companies;
CREATE TRIGGER companies_search_refresh BEFORE INSERT OR UPDATE
  ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_search_refresh();

UPDATE public.companies SET name = name;  -- triggers refresh of existing rows
CREATE INDEX IF NOT EXISTS companies_search_en_idx ON public.companies USING GIN (search_en);
CREATE INDEX IF NOT EXISTS companies_search_fr_idx ON public.companies USING GIN (search_fr);

-- ---------- PRODUCTS ----------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.products_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english', COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  NEW.search_fr := to_tsvector('french',  COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_search_refresh ON public.products;
CREATE TRIGGER products_search_refresh BEFORE INSERT OR UPDATE
  ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_search_refresh();

UPDATE public.products SET name = name;
CREATE INDEX IF NOT EXISTS products_search_en_idx ON public.products USING GIN (search_en);
CREATE INDEX IF NOT EXISTS products_search_fr_idx ON public.products USING GIN (search_fr);

-- ---------- SERVICES ----------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.services_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.name_en,'') || ' ' || COALESCE(NEW.description_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.name_fr,'') || ' ' || COALESCE(NEW.description_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS services_search_refresh ON public.services;
CREATE TRIGGER services_search_refresh BEFORE INSERT OR UPDATE
  ON public.services FOR EACH ROW EXECUTE FUNCTION public.services_search_refresh();

UPDATE public.services SET name_en = name_en;
CREATE INDEX IF NOT EXISTS services_search_en_idx ON public.services USING GIN (search_en);
CREATE INDEX IF NOT EXISTS services_search_fr_idx ON public.services USING GIN (search_fr);

-- ---------- OPPORTUNITIES ----------
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.opportunities_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.summary_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.summary_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS opportunities_search_refresh ON public.opportunities;
CREATE TRIGGER opportunities_search_refresh BEFORE INSERT OR UPDATE
  ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.opportunities_search_refresh();

UPDATE public.opportunities SET title_en = title_en;
CREATE INDEX IF NOT EXISTS opportunities_search_en_idx ON public.opportunities USING GIN (search_en);
CREATE INDEX IF NOT EXISTS opportunities_search_fr_idx ON public.opportunities USING GIN (search_fr);

-- ---------- CONTENT_ITEMS ----------
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.content_items_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.excerpt_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.excerpt_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS content_items_search_refresh ON public.content_items;
CREATE TRIGGER content_items_search_refresh BEFORE INSERT OR UPDATE
  ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.content_items_search_refresh();

UPDATE public.content_items SET title_en = title_en;
CREATE INDEX IF NOT EXISTS content_items_search_en_idx ON public.content_items USING GIN (search_en);
CREATE INDEX IF NOT EXISTS content_items_search_fr_idx ON public.content_items USING GIN (search_fr);

-- ---------- REPORTS ----------
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.reports_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.summary_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.summary_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reports_search_refresh ON public.reports;
CREATE TRIGGER reports_search_refresh BEFORE INSERT OR UPDATE
  ON public.reports FOR EACH ROW EXECUTE FUNCTION public.reports_search_refresh();

UPDATE public.reports SET title_en = title_en;
CREATE INDEX IF NOT EXISTS reports_search_en_idx ON public.reports USING GIN (search_en);
CREATE INDEX IF NOT EXISTS reports_search_fr_idx ON public.reports USING GIN (search_fr);

-- ---------- RPC ----------
DROP FUNCTION IF EXISTS public.global_search(text, text, integer);

CREATE OR REPLACE FUNCTION public.global_search(q text, lang text DEFAULT 'en', max_per_type integer DEFAULT 8)
RETURNS TABLE (
  entity_type text,
  entity_id   uuid,
  title       text,
  snippet     text,
  href        text,
  rank        real
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH tsq AS (
    SELECT
      CASE WHEN lang = 'fr'
        THEN plainto_tsquery('french', q)
        ELSE plainto_tsquery('english', q)
      END AS q
  )
  SELECT * FROM (
    -- Companies (only verified)
    SELECT 'company'::text AS entity_type, c.id AS entity_id,
           c.name AS title,
           LEFT(COALESCE(c.description,''), 160) AS snippet,
           '/companies/' || c.id::text AS href,
           ts_rank(CASE WHEN lang='fr' THEN c.search_fr ELSE c.search_en END, (SELECT q FROM tsq)) AS rank
    FROM public.companies c, tsq
    WHERE c.status = 'verified'
      AND (CASE WHEN lang='fr' THEN c.search_fr ELSE c.search_en END) @@ tsq.q
    ORDER BY rank DESC
    LIMIT max_per_type
  ) UNION ALL
  SELECT * FROM (
    -- Products (only via verified company)
    SELECT 'product'::text, p.id,
           p.name, LEFT(COALESCE(p.description,''), 160),
           '/products/' || p.id::text,
           ts_rank(CASE WHEN lang='fr' THEN p.search_fr ELSE p.search_en END, (SELECT q FROM tsq))
    FROM public.products p
    JOIN public.companies c ON c.id = p.company_id AND c.status = 'verified'
    , tsq
    WHERE (CASE WHEN lang='fr' THEN p.search_fr ELSE p.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) UNION ALL
  SELECT * FROM (
    -- Services
    SELECT 'service'::text, s.id,
           CASE WHEN lang='fr' THEN s.name_fr ELSE s.name_en END,
           LEFT(COALESCE(CASE WHEN lang='fr' THEN s.description_fr ELSE s.description_en END,''), 160),
           '/companies/' || s.company_id::text,  -- services land on company profile
           ts_rank(CASE WHEN lang='fr' THEN s.search_fr ELSE s.search_en END, (SELECT q FROM tsq))
    FROM public.services s
    JOIN public.companies c ON c.id = s.company_id AND c.status = 'verified'
    , tsq
    WHERE s.status = 'active'
      AND (CASE WHEN lang='fr' THEN s.search_fr ELSE s.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) UNION ALL
  SELECT * FROM (
    -- Opportunities
    SELECT 'opportunity'::text, o.id,
           CASE WHEN lang='fr' THEN o.title_fr ELSE o.title_en END,
           LEFT(COALESCE(CASE WHEN lang='fr' THEN o.summary_fr ELSE o.summary_en END,''), 160),
           '/opportunities/' || o.category || '/' || o.slug,
           ts_rank(CASE WHEN lang='fr' THEN o.search_fr ELSE o.search_en END, (SELECT q FROM tsq))
    FROM public.opportunities o, tsq
    WHERE o.status = 'published'
      AND (CASE WHEN lang='fr' THEN o.search_fr ELSE o.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) UNION ALL
  SELECT * FROM (
    -- Content (news / event / blog)
    SELECT 'content'::text, ci.id,
           CASE WHEN lang='fr' THEN ci.title_fr ELSE ci.title_en END,
           LEFT(COALESCE(CASE WHEN lang='fr' THEN ci.excerpt_fr ELSE ci.excerpt_en END,''), 160),
           '/' || CASE ci.type
             WHEN 'blog' THEN 'blog'
             WHEN 'event' THEN 'events'
             ELSE 'news'
           END || '/' || ci.slug,
           ts_rank(CASE WHEN lang='fr' THEN ci.search_fr ELSE ci.search_en END, (SELECT q FROM tsq))
    FROM public.content_items ci, tsq
    WHERE ci.status = 'published'
      AND (CASE WHEN lang='fr' THEN ci.search_fr ELSE ci.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) UNION ALL
  SELECT * FROM (
    -- Reports (data hub)
    SELECT 'report'::text, r.id,
           CASE WHEN lang='fr' THEN r.title_fr ELSE r.title_en END,
           LEFT(COALESCE(CASE WHEN lang='fr' THEN r.summary_fr ELSE r.summary_en END,''), 160),
           '/data-hub/reports/' || r.kind || '/' || r.slug,
           ts_rank(CASE WHEN lang='fr' THEN r.search_fr ELSE r.search_en END, (SELECT q FROM tsq))
    FROM public.reports r, tsq
    WHERE r.status = 'published'
      AND (CASE WHEN lang='fr' THEN r.search_fr ELSE r.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  );
$$;

REVOKE EXECUTE ON FUNCTION public.global_search(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_search(text, text, integer) TO anon, authenticated;
```

Bump CLAUDE.md to "next free: 00010".

Do not apply.

## Task 2: Types + rank helper TDD

`src/lib/search/types.ts`:
```ts
export type SearchEntityType = "company" | "product" | "service" | "opportunity" | "content" | "report";

export interface SearchResult {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  snippet: string;
  href: string;
  rank: number;
}
```

`src/lib/search/rank.ts`:
```ts
import type { SearchResult, SearchEntityType } from "./types";

// Visual ordering for grouped UI (most "actionable" first).
export const TYPE_ORDER: SearchEntityType[] = [
  "company","product","service","opportunity","report","content",
];

export function groupResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
  const empty: Record<SearchEntityType, SearchResult[]> = {
    company: [], product: [], service: [], opportunity: [], content: [], report: [],
  };
  for (const r of results) {
    (empty[r.entity_type] ??= []).push(r);
  }
  for (const k of TYPE_ORDER) empty[k].sort((a, b) => b.rank - a.rank);
  return empty;
}
```

`rank.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { groupResults, TYPE_ORDER } from "./rank";

describe("rank.groupResults", () => {
  it("groups by entity_type and sorts by rank desc within group", () => {
    const r = groupResults([
      { entity_type: "company", entity_id: "1", title: "A", snippet: "", href: "/a", rank: 0.2 },
      { entity_type: "company", entity_id: "2", title: "B", snippet: "", href: "/b", rank: 0.9 },
      { entity_type: "report",  entity_id: "3", title: "C", snippet: "", href: "/c", rank: 0.5 },
    ]);
    expect(r.company.map(x => x.entity_id)).toEqual(["2","1"]);
    expect(r.report.map(x => x.entity_id)).toEqual(["3"]);
    expect(r.product).toEqual([]);
  });
  it("TYPE_ORDER lists 6 types", () => {
    expect(TYPE_ORDER.length).toBe(6);
  });
});
```

`src/lib/search/api.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchResult } from "./types";

export async function runGlobalSearch(
  supabase: SupabaseClient,
  q: string,
  lang: "en" | "fr",
  maxPerType = 8,
): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const { data, error } = await supabase.rpc("global_search", { q, lang, max_per_type: maxPerType });
  if (error) {
    console.error("[search.runGlobalSearch]", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as SearchResult[];
}
```

Run vitest → 19 tests pass (17 + 2 new).

## Task 3: i18n

`Search.*`:
```json
"Search": {
  "placeholder": "Search…",
  "openHint": "Press ⌘K",
  "noResults": "No matches.",
  "viewAll": "See all results for \"{q}\"",
  "groups": {
    "company": "Companies",
    "product": "Products",
    "service": "Services",
    "opportunity": "Opportunities",
    "content": "News & Articles",
    "report": "Reports"
  },
  "page": { "title": "Search", "queryLabel": "Query" }
}
```

FR: placeholder → "Rechercher…", openHint → "Appuyez sur ⌘K", noResults → "Aucun résultat.", viewAll → "Voir tous les résultats pour « {q} »", groups: "Entreprises" / "Produits" / "Services" / "Opportunités" / "Actualités et articles" / "Rapports", page.title → "Recherche", page.queryLabel → "Requête".

## Task 4: CommandPalette + ResultItem + integration

### `src/components/search/result-item.tsx`

```tsx
import { Link } from "@/i18n/routing";
import type { SearchResult } from "@/lib/search/types";

export function ResultItem({ item }: { item: SearchResult }) {
  return (
    <Link
      href={item.href}
      className="block px-3 py-2 rounded hover:bg-muted text-sm"
    >
      <div className="font-medium truncate">{item.title}</div>
      {item.snippet && <div className="text-xs text-muted-foreground truncate">{item.snippet}</div>}
    </Link>
  );
}
```

### `src/components/search/command-palette.tsx` (client)

```tsx
"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { runGlobalSearch } from "@/lib/search/api";
import { groupResults, TYPE_ORDER } from "@/lib/search/rank";
import { ResultItem } from "./result-item";
import type { SearchResult, SearchEntityType } from "@/lib/search/types";
import { useRouter } from "@/i18n/routing";

export function CommandPalette() {
  const t = useTranslations("Search");
  const locale = useLocale() as "en" | "fr";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, startTransition] = useTransition();

  // Hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const supabase = createClient();
        const rows = await runGlobalSearch(supabase, q, locale, 5);
        setResults(rows);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [q, open, locale]);

  const grouped = useMemo(() => groupResults(results), [results]);

  function onViewAll() {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="p-3 border-b">
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            className="h-9 text-sm border-0 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2 text-sm">
          {q && results.length === 0 && <p className="px-2 py-4 text-muted-foreground">{t("noResults")}</p>}
          {TYPE_ORDER.map((type: SearchEntityType) => {
            const rows = grouped[type];
            if (!rows.length) return null;
            return (
              <section key={type} className="mb-2">
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t(`groups.${type}`)}
                </div>
                {rows.map((r) => <ResultItem key={`${type}:${r.entity_id}`} item={r} />)}
              </section>
            );
          })}
          {q && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full mt-2 px-3 py-2 text-left text-xs text-primary hover:bg-muted rounded"
            >
              {t("viewAll", { q })}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Mount in `src/app/[locale]/layout.tsx`

Add `<CommandPalette />` near where `<Toaster />` is mounted, inside Suspense:
```tsx
<Suspense fallback={null}><CommandPalette /></Suspense>
```

(If `Suspense` already covers other client-only widgets, add inside the existing one.)

## Task 5: `/search` results page

`src/app/[locale]/search/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runGlobalSearch } from "@/lib/search/api";
import { groupResults, TYPE_ORDER } from "@/lib/search/rank";
import type { SearchEntityType } from "@/lib/search/types";
import { ResultItem } from "@/components/search/result-item";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const filterType = sp.type as SearchEntityType | undefined;
  const t = await getTranslations({ locale, namespace: "Search" });
  const supabase = await createServerSupabaseClient();
  const rows = q ? await runGlobalSearch(supabase, q, locale as "en" | "fr", 20) : [];
  const grouped = groupResults(rows);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">{t("page.title")}</h1>
      {q && <p className="text-sm text-muted-foreground mb-6">{t("page.queryLabel")}: <span className="font-medium">{q}</span></p>}
      {/* Facets */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a href={`/${locale}/search?q=${encodeURIComponent(q)}`} className={`px-3 py-1 rounded-full text-xs border ${!filterType ? "bg-primary text-primary-foreground" : "bg-card"}`}>All</a>
        {TYPE_ORDER.map(tp => (
          <a key={tp} href={`/${locale}/search?q=${encodeURIComponent(q)}&type=${tp}`}
             className={`px-3 py-1 rounded-full text-xs border ${filterType === tp ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {t(`groups.${tp}`)}
          </a>
        ))}
      </div>
      {q && rows.length === 0 && <p className="text-muted-foreground">{t("noResults")}</p>}
      {TYPE_ORDER.filter(tp => !filterType || tp === filterType).map((tp) => {
        const list = grouped[tp];
        if (!list.length) return null;
        return (
          <section key={tp} className="mb-6">
            <h2 className="text-sm font-semibold mb-2">{t(`groups.${tp}`)}</h2>
            <div className="space-y-1">
              {list.map((r) => <ResultItem key={`${tp}:${r.entity_id}`} item={r} />)}
            </div>
          </section>
        );
      })}
    </main>
  );
}
```

## Task 6: Verify + commit

- `npx vitest run` — 19/19.
- `npm run build` — clean.
- `npx eslint --quiet <S7 paths>` — no errors.

## Self-Review

- **Spec coverage:** §9 of master roadmap. Postgres FTS (T1), bilingual (T1 — english/french configs), Cmd+K + dialog (T4), `/search` (T5), facets (T5).
- **YAGNI:** No external search service. No typeahead suggestions, no synonyms.
- **Security:** RPC SECURITY INVOKER respects RLS via the public-read policies on each table; the RPC itself only returns rows that the calling role's RLS already allows.

## Done definition

- 19+ tests; build/lint clean.
- Migration 00009 committed.
- Cmd+K opens; typing returns grouped results within 300 ms (assuming migration applied).
- `/search?q=…&type=…` page works with facets in both locales.
