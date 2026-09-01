# S3 — News / Events / Blog Content Wiring + Admin CMS

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stand up one polymorphic `content_items` table that backs News, Events, and Blog. Wire the existing public route scaffolds to DB. Build a tight admin CMS at `/admin/content/{news,events,blog}` so admins can publish bilingual content end-to-end.

**Architecture:** Single `content_items` table with a `type` enum and per-type optional columns (event_start_at, event_end_at, event_location). Body stored as plain markdown text in `body_en` / `body_fr` (skip TipTap for now — markdown is open-source, self-hostable, and avoids a heavy editor dependency; we can swap to TipTap in a later slice without losing data via a one-shot conversion). Server pages render markdown via `react-markdown` (already widely used, MIT-licensed, lightweight).

**Tech Stack:** Next.js 16 App Router, Supabase, next-intl, shadcn/ui, react-markdown (newly added).

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §5 (S3).

**No commits per task** — orchestrator runs verify + commit at end of slice.

---

## File Structure

**Create:**
- `supabase/migrations/00005_content_items.sql` — `content_items` table + RLS + indexes.
- `src/lib/content/types.ts` — `ContentType`, `ContentStatus`, `ContentItem` types.
- `src/lib/content/queries.ts` — server-side fetchers: `listPublished(type, locale, limit?)`, `getBySlug(type, slug, locale)`.
- `src/lib/content/queries.test.ts` — unit test on a pure helper (slug sanitization).
- `src/lib/content/slug.ts` and `slug.test.ts` — kebab-case slugify helper with diacritic handling.
- `src/components/content/markdown-view.tsx` — safe markdown renderer wrapper.
- `src/components/content/content-card.tsx` — list-item card used on home + section pages.
- `src/app/[locale]/admin/content/layout.tsx` — sub-shell with tabs for news/events/blog.
- `src/app/[locale]/admin/content/[type]/page.tsx` — list page per type.
- `src/app/[locale]/admin/content/[type]/new/page.tsx` — create form (Server Component shell + Client form).
- `src/app/[locale]/admin/content/[type]/[id]/page.tsx` — edit form.
- `src/app/[locale]/admin/content/content-form.tsx` — shared client-side editor (bilingual EN/FR tabs).

**Modify:**
- `src/app/[locale]/news/page.tsx` — hydrate from `content_items` where `type='news' AND status='published'`.
- `src/app/[locale]/news/[slug]/page.tsx` — fetch by slug.
- `src/app/[locale]/events/page.tsx` and `[slug]/page.tsx` — same pattern.
- `src/app/[locale]/blog/page.tsx` and `[slug]/page.tsx` — same pattern.
- `src/app/[locale]/page.tsx` (home) — section showing 3 newest items per type (if not already showing).
- `src/app/[locale]/admin/AdminLayoutClient.tsx` — sidebar entry for "Content".
- `src/config/messages/en.json` + `fr.json` — `Content.*` namespace.
- `src/app/[locale]/admin/CLAUDE.md` — append a note about content RLS.
- `supabase/migrations/CLAUDE.md` — bump "next free" to 00006.

---

## Task 1: Migration `00005_content_items.sql`

**Files:**
- Create: `supabase/migrations/00005_content_items.sql`

- [ ] **Step 1: Read** 00001 + 00004 to match the project's SQL style, confirm `public.is_admin()` exists (used in policies), and confirm trigger helper conventions.

- [ ] **Step 2: Write the migration**

```sql
-- 00005_content_items.sql
-- Polymorphic content table for News, Events, and Blog posts.

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('news','event','blog')),
  slug text NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  excerpt_en text,
  excerpt_fr text,
  body_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  cover_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  -- event-only fields (null for news/blog)
  event_start_at timestamptz,
  event_end_at timestamptz,
  event_location text,
  -- common metadata
  tags text[] NOT NULL DEFAULT '{}',
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS content_items_type_status_published_at_idx
  ON public.content_items (type, status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS content_items_event_start_idx
  ON public.content_items (event_start_at)
  WHERE type = 'event';

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Public read: only published items.
CREATE POLICY "content_items_public_read_published"
  ON public.content_items FOR SELECT
  USING (status = 'published');

-- Admin full read/write.
CREATE POLICY "content_items_admin_all"
  ON public.content_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger (touch_updated_at created in 00004).
DROP TRIGGER IF EXISTS content_items_updated ON public.content_items;
CREATE TRIGGER content_items_updated BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Ensure published_at gets set when transitioning to 'published'.
CREATE OR REPLACE FUNCTION public.content_items_published_at_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_items_published_at ON public.content_items;
CREATE TRIGGER content_items_published_at BEFORE INSERT OR UPDATE
  ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.content_items_published_at_guard();
```

- [ ] **Step 3:** Do NOT apply — Supabase project paused. Orchestrator will `supabase db push` once unpaused (along with 00003 + 00004).

---

## Task 2: Types + slug helper (TDD)

**Files:**
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/slug.ts`
- Create: `src/lib/content/slug.test.ts`

- [ ] **Step 1: Failing test**

`src/lib/content/slug.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and kebabs simple text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("collapses runs of punctuation", () => {
    expect(slugify("Hello,   World!!")).toBe("hello-world");
  });
  it("strips diacritics (French)", () => {
    expect(slugify("Côte d'Ivoire — économie")).toBe("cote-d-ivoire-economie");
  });
  it("returns empty string for all-punctuation input", () => {
    expect(slugify("!!!---???")).toBe("");
  });
  it("trims leading and trailing dashes", () => {
    expect(slugify("  -hello-")).toBe("hello");
  });
});
```

Run: `npx vitest run src/lib/content/slug.test.ts` → FAIL.

- [ ] **Step 2: Implementation**

`src/lib/content/slug.ts`:
```ts
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")    // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")        // non-alnum → dash
    .replace(/^-+|-+$/g, "");           // trim leading/trailing
}
```

`src/lib/content/types.ts`:
```ts
export type ContentType = "news" | "event" | "blog";
export type ContentStatus = "draft" | "published" | "archived";

export interface ContentItem {
  id: string;
  type: ContentType;
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string | null;
  excerpt_fr: string | null;
  body_en: string;
  body_fr: string;
  cover_url: string | null;
  author_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_location: string | null;
  tags: string[];
  sector_id: string | null;
  created_at: string;
  updated_at: string;
}
```

Run: `npx vitest run` → 5 prior tests + 5 new = 10 pass.

---

## Task 3: Query helpers

**Files:**
- Create: `src/lib/content/queries.ts`

- [ ] **Step 1:** Implement two pure-ish functions (they take a Supabase client so they're testable later via dependency injection):

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentItem, ContentType } from "./types";

export async function listPublished(
  supabase: SupabaseClient,
  type: ContentType,
  opts: { limit?: number } = {}
): Promise<ContentItem[]> {
  const { limit = 20 } = opts;
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[content.listPublished]", error.code, error.message);
    return [];
  }
  return (data ?? []) as ContentItem[];
}

export async function getBySlug(
  supabase: SupabaseClient,
  type: ContentType,
  slug: string
): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as ContentItem;
}
```

---

## Task 4: Markdown renderer + content card

**Files:**
- Create: `src/components/content/markdown-view.tsx`
- Create: `src/components/content/content-card.tsx`
- Modify: `package.json` (add `react-markdown` + `remark-gfm`)

- [ ] **Step 1: Install**

```bash
npm install react-markdown remark-gfm
```

- [ ] **Step 2: `markdown-view.tsx`**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownView({ source }: { source: string }) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
```

If the project doesn't have Tailwind Typography (`@tailwindcss/typography`) installed, swap `prose` classes for manual styling — but typography is the standard choice; install if missing.

- [ ] **Step 3: `content-card.tsx`**

```tsx
import Link from "next/link";
import type { ContentItem } from "@/lib/content/types";

export function ContentCard({
  item,
  locale,
}: {
  item: ContentItem;
  locale: string;
}) {
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const excerpt = locale === "fr" ? item.excerpt_fr : item.excerpt_en;
  const href = `/${locale}/${item.type === "blog" ? "blog" : item.type === "event" ? "events" : "news"}/${item.slug}`;
  const date = item.published_at ? new Date(item.published_at).toLocaleDateString(locale) : null;
  return (
    <Link href={href} className="block border rounded-md p-4 bg-card hover:bg-muted/40 transition">
      <h3 className="font-medium mb-1">{title}</h3>
      {excerpt && <p className="text-sm text-muted-foreground mb-2">{excerpt}</p>}
      {date && <p className="text-xs text-muted-foreground">{date}</p>}
    </Link>
  );
}
```

---

## Task 5: Wire public News pages

**Files:**
- Modify: `src/app/[locale]/news/page.tsx`
- Modify: `src/app/[locale]/news/[slug]/page.tsx`

- [ ] **Step 1: Read** both files to understand the existing structure (likely placeholders / static data).

- [ ] **Step 2: Convert list page** to:

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listPublished } from "@/lib/content/queries";
import { ContentCard } from "@/components/content/content-card";

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Content.news" });
  const supabase = await createServerSupabaseClient();
  const items = await listPublished(supabase, "news", { limit: 50 });
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("subtitle")}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3">
          {items.map((i) => <ContentCard key={i.id} item={i} locale={locale} />)}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Detail page** `news/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBySlug } from "@/lib/content/queries";
import { MarkdownView } from "@/components/content/markdown-view";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const item = await getBySlug(supabase, "news", slug);
  if (!item) notFound();
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const body = locale === "fr" ? item.body_fr : item.body_en;
  const date = item.published_at ? new Date(item.published_at).toLocaleDateString(locale) : "";
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">{title}</h1>
      <p className="text-xs text-muted-foreground mb-6">{date}</p>
      <MarkdownView source={body} />
    </main>
  );
}
```

## Task 6: Wire public Events pages

**Files:**
- Modify: `src/app/[locale]/events/page.tsx`
- Modify: `src/app/[locale]/events/[slug]/page.tsx`

Same shape as News, but on the list, also surface `event_start_at` and `event_location`. Sort by `event_start_at` ascending where present, else by `published_at` desc.

Adjust `listPublished` call inline or add an `eventsListPublished` if the sort differs enough.

## Task 7: Wire public Blog pages

**Files:**
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`

Same shape as News. No event-specific fields.

## Task 8: Admin CMS shell + list pages

**Files:**
- Create: `src/app/[locale]/admin/content/layout.tsx`
- Create: `src/app/[locale]/admin/content/page.tsx` (redirects to news)
- Create: `src/app/[locale]/admin/content/[type]/page.tsx`

- [ ] **Step 1: Layout** with three tabs: News / Events / Blog. Use `Tabs` from shadcn if available, otherwise plain Link-based nav.

- [ ] **Step 2: `[type]/page.tsx`** lists all items of that type (admin sees draft + published + archived). Columns: title (EN), status, updated_at. Each row links to `/admin/content/<type>/<id>`.

Validate `type` against the enum; if invalid, return `notFound()`.

## Task 9: Admin create + edit forms

**Files:**
- Create: `src/app/[locale]/admin/content/[type]/new/page.tsx`
- Create: `src/app/[locale]/admin/content/[type]/[id]/page.tsx`
- Create: `src/app/[locale]/admin/content/content-form.tsx`

- [ ] **Step 1: `content-form.tsx`** (client component) — fields:
  - `title_en`, `title_fr` (text inputs)
  - `excerpt_en`, `excerpt_fr` (text inputs)
  - `body_en`, `body_fr` (textarea, monospace; previews via `MarkdownView` toggled by a button)
  - `cover_url` (text input)
  - `tags` (comma-separated, parsed to array)
  - `sector_id` (Select bound to existing sectors)
  - `slug` (text input, auto-filled from `slugify(title_en)` if empty)
  - For type === "event": `event_start_at`, `event_end_at` (date inputs, ISO), `event_location`
  - `status` (Select: draft/published/archived)
  - Save → upsert into `content_items`; toast.success on done.

- [ ] **Step 2: `new/page.tsx`** renders `<ContentForm type={type} />` with empty initial values.

- [ ] **Step 3: `[id]/page.tsx`** fetches the row, passes initial values to `<ContentForm type={type} initial={row} />`. Includes a "Delete" button that calls `DELETE` and redirects to the list.

The form is admin-only — protected by parent `admin/layout.tsx` server guard from S1.

## Task 10: Wire admin sidebar + i18n + home highlights

**Files:**
- Modify: `src/app/[locale]/admin/AdminLayoutClient.tsx`
- Modify: `src/config/messages/en.json` and `fr.json`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Admin sidebar** — add a "Content" link to `/admin/content` between Verifications and Companies (or wherever fits in the existing order).

- [ ] **Step 2: Messages** — add `Content.news`, `Content.events`, `Content.blog` (title/subtitle/empty), and `Content.admin.*` (form labels, statuses) in both `en.json` and `fr.json`.

- [ ] **Step 3: Home** — if the home page has a "Latest news" or similar section, hydrate it from `listPublished(supabase, "news", { limit: 3 })`. If no such section exists, skip — don't redesign the home page in this slice.

## Task 11: Verification + ship-wreck + commit

- [ ] **Step 1:** `npx vitest run` — at least 10 tests pass (5 prior + 5 slug).
- [ ] **Step 2:** `npm run build` — clean.
- [ ] **Step 3:** `npx eslint <touched-files>` — clean. Fix any `any`/unused-imports we introduce.
- [ ] **Step 4:** Orchestrator runs ship-wreck-check.
- [ ] **Step 5:** Single commit on `main`.

---

## Self-Review

- **Spec coverage:** §5 of master roadmap — `content_items` table (T1), public list+detail for 3 types (T5-T7), admin CMS (T8-T9), bilingual (everywhere), home highlights conditional (T10).
- **YAGNI:** No TipTap, no scheduled-publish, no draft-preview-URL — just markdown text + status enum + the `published_at` guard trigger.
- **Security:** RLS public-read gated by `status='published'`; admin write via `is_admin()`.
- **No placeholders:** every task has code + acceptance criteria.

## Done definition

- 10 tests pass, build + lint clean, ship-wreck-check passes.
- Migration 00005 committed (apply queued behind 00003+00004).
- Public News/Events/Blog pages render DB content in both locales.
- Admin CMS lets an admin create, edit, publish, archive, and delete a bilingual content item.
- Trust Center, Auth, and Admin guard from prior slices still work.
