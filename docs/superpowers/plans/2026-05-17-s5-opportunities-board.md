# S5 — Opportunities Board v2

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) syntax.

**Goal:** Promote the RFQ engine into a full Opportunities Board with eight categories (tender, PPP, investment_call, offer, demand, quotation, partner_search, project_launch). Verified companies submit, admins approve, the public browses. Reuses existing `conversations`/`messages` for contact threads.

**Architecture:**
- New `opportunities` table — supersedes the use-case of `rfq_listings` but the older table stays in place untouched (backwards compat with anything already wired to it).
- Submission: verified, email-verified company owners can `INSERT` opportunities in `status='pending_review'`. Admins move them to `published` or `rejected`.
- Public reads only `status='published'`. Detail page links to a `conversations` thread (existing table) with a "Contact" button that creates the conversation if absent.

**Tech Stack:** Next.js 16, Supabase, next-intl, shadcn/ui, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §7 (S5).

**No commits per task** — orchestrator runs verify + ship-wreck + single commit.

---

## File Structure

**Create:**
- `supabase/migrations/00007_opportunities.sql`
- `src/lib/opportunities/types.ts`, `categories.ts`, `categories.test.ts`, `queries.ts`
- `src/components/opportunities/category-badge.tsx`
- `src/components/opportunities/opportunity-card.tsx`
- `src/components/opportunities/contact-button.tsx`
- `src/app/[locale]/opportunities/page.tsx` (rewrite — currently scaffold)
- `src/app/[locale]/opportunities/[slug]/page.tsx` (rewrite — currently scaffold or by slug)
- `src/app/[locale]/dashboard/opportunities/page.tsx` (user's own opportunities)
- `src/app/[locale]/dashboard/opportunities/new/page.tsx` (submission form)
- `src/app/[locale]/dashboard/opportunities/[id]/page.tsx` (edit form)
- `src/app/[locale]/dashboard/opportunities/opportunity-form.tsx` (shared client form)
- `src/app/[locale]/admin/opportunities/page.tsx` (moderation queue)
- `src/app/[locale]/admin/opportunities/[id]/page.tsx` (review one)

**Modify:**
- `src/config/messages/en.json` + `fr.json` — `Opportunities.*` namespace.
- `src/app/[locale]/admin/AdminLayoutClient.tsx` — sidebar entry "Opportunities" between Content and Companies.
- `src/config/navigation.ts` — top-level Opportunities entry (already exists? if so, point at new pages).
- `supabase/migrations/CLAUDE.md` — bump to 00008.

---

## Canonical category list (locked)

```ts
export const OPPORTUNITY_CATEGORIES = [
  "tender",
  "ppp",
  "investment_call",
  "offer",
  "demand",
  "quotation",
  "partner_search",
  "project_launch",
] as const;
export type OpportunityCategory = typeof OPPORTUNITY_CATEGORIES[number];
```

---

## Task 1: Migration `00007_opportunities.sql`

**Files:**
- Create: `supabase/migrations/00007_opportunities.sql`

- [ ] **Step 1: Read 00001 + 00004 + 00006** for conventions; confirm `public.is_admin()`, `public.is_email_verified()`, `public.touch_updated_at()` exist.

- [ ] **Step 2: Write**

```sql
-- 00007_opportunities.sql
-- Full Opportunities Board: tenders, PPP, investment calls, offers/demands,
-- quotations, partner searches, project launches. Companies submit; admins approve.

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'tender','ppp','investment_call','offer','demand',
    'quotation','partner_search','project_launch'
  )),
  slug text NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  summary_en text NOT NULL,
  summary_fr text NOT NULL,
  body_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  budget_min numeric,
  budget_max numeric,
  budget_currency text DEFAULT 'USD',
  deadline_at timestamptz,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  region text,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft','pending_review','published','rejected','expired')),
  rejected_reason text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE INDEX IF NOT EXISTS opportunities_pub_idx
  ON public.opportunities (category, status, published_at DESC NULLS LAST)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS opportunities_deadline_idx
  ON public.opportunities (deadline_at)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS opportunities_company_idx
  ON public.opportunities (company_id);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Public sees only published.
CREATE POLICY "opportunities_public_read"
  ON public.opportunities FOR SELECT
  USING (status = 'published');

-- Owner sees own opportunities in any status.
CREATE POLICY "opportunities_owner_read"
  ON public.opportunities FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

-- Owner inserts in pending_review; email-verified gate enforced.
CREATE POLICY "opportunities_owner_insert"
  ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_email_verified()
    AND EXISTS (SELECT 1 FROM public.companies c
                WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review')
  );

-- Owner can update their own opportunity, but only when not yet published
-- (after published, only admin can change it).
CREATE POLICY "opportunities_owner_update"
  ON public.opportunities FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review','rejected')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review')
  );

-- Owner delete only on drafts.
CREATE POLICY "opportunities_owner_delete"
  ON public.opportunities FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status = 'draft'
  );

-- Admin full control.
CREATE POLICY "opportunities_admin_all"
  ON public.opportunities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at + publish guard.
DROP TRIGGER IF EXISTS opportunities_updated ON public.opportunities;
CREATE TRIGGER opportunities_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.opportunities_published_at_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opportunities_published_at ON public.opportunities;
CREATE TRIGGER opportunities_published_at BEFORE INSERT OR UPDATE
  ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.opportunities_published_at_guard();
```

- [ ] **Step 3:** Do not apply.

---

## Task 2: Types + categories TDD

**Files:**
- Create: `src/lib/opportunities/categories.ts`, `categories.test.ts`, `types.ts`, `queries.ts`

- [ ] **Step 1: Failing test** (analogous to S4 segments test):

```ts
import { describe, it, expect } from "vitest";
import { OPPORTUNITY_CATEGORIES, isOpportunityCategory } from "./categories";

describe("opportunity categories", () => {
  it("exposes 8 canonical categories in order", () => {
    expect(OPPORTUNITY_CATEGORIES).toEqual([
      "tender","ppp","investment_call","offer","demand",
      "quotation","partner_search","project_launch",
    ]);
  });
  it("isOpportunityCategory accepts valid keys", () => {
    expect(isOpportunityCategory("tender")).toBe(true);
    expect(isOpportunityCategory("ppp")).toBe(true);
    expect(isOpportunityCategory("not_real")).toBe(false);
  });
});
```

- [ ] **Step 2: Implementations** (categories.ts + types.ts following S4 pattern). For types include `Opportunity` interface mirroring the migration columns; `OpportunityStatus` = `"draft"|"pending_review"|"published"|"rejected"|"expired"`.

- [ ] **Step 3: Queries.ts**
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Opportunity, OpportunityCategory } from "./types";

export async function listPublished(
  supabase: SupabaseClient,
  opts: { category?: OpportunityCategory; limit?: number } = {}
): Promise<Opportunity[]> {
  let q = supabase
    .from("opportunities")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error("[opportunities.listPublished]", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as Opportunity[];
}

export async function getBySlug(
  supabase: SupabaseClient,
  category: OpportunityCategory,
  slug: string
): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("category", category)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as unknown as Opportunity;
}
```

Run vitest → 15 tests pass.

---

## Task 3: i18n namespace

Add `Opportunities.*` to both `en.json` and `fr.json`:

EN sketch (translate FR identically):
```json
"Opportunities": {
  "navLabel": "Opportunities",
  "page": {
    "title": "Opportunities Board",
    "subtitle": "Tenders, PPPs, investment calls and partnerships from DRC.",
    "empty": "No opportunities published yet."
  },
  "categories": {
    "tender": "Tenders",
    "ppp": "PPP",
    "investment_call": "Investment calls",
    "offer": "Offers",
    "demand": "Demands",
    "quotation": "Quotations",
    "partner_search": "Partner search",
    "project_launch": "Project launches"
  },
  "filters": { "category": "Category", "sector": "Sector", "any": "Any" },
  "fields": {
    "title": "Title",
    "summary": "Summary (1-3 sentences)",
    "body": "Details (markdown)",
    "category": "Category",
    "deadline": "Deadline",
    "budget": "Budget",
    "region": "Region",
    "sector": "Sector",
    "slug": "URL slug"
  },
  "status": {
    "draft": "Draft",
    "pending_review": "Pending review",
    "published": "Published",
    "rejected": "Rejected",
    "expired": "Expired"
  },
  "dashboard": {
    "title": "My opportunities",
    "new": "New opportunity",
    "submit": "Submit for review",
    "save": "Save",
    "saved": "Saved.",
    "submitted": "Submitted. Admin will review."
  },
  "admin": {
    "queue": "Moderation queue",
    "approve": "Approve",
    "reject": "Reject",
    "rejectReason": "Reason (optional)",
    "approved": "Approved.",
    "rejected": "Rejected."
  },
  "contact": "Contact the company"
}
```

FR keeps the same structure; values translated.

---

## Task 4: Category badge

`src/components/opportunities/category-badge.tsx` — like SegmentBadge but with category-specific lucide icons:

```ts
const iconByCategory: Record<OpportunityCategory, React.ElementType> = {
  tender: Gavel,
  ppp: HandshakeIcon ?? Handshake,           // if HandshakeIcon doesn't exist use Handshake
  investment_call: TrendingUp,
  offer: Tag,
  demand: ShoppingCart,
  quotation: FileText,
  partner_search: Users,
  project_launch: Rocket,
};
```

Read available icons in lucide-react before saving. Substitute reasonably if any are missing.

---

## Task 5: Public Opportunities pages

Rewrite `src/app/[locale]/opportunities/page.tsx`:
- Reads all published opportunities, with optional `?category=<cat>` filter (via `searchParams`).
- Renders a category strip (8 chips that link to `?category=...`).
- Grid of `OpportunityCard` (new component) showing title, category badge, deadline if present, company name (server join), summary.

Rewrite `src/app/[locale]/opportunities/[slug]/page.tsx`:
- The route param is the SLUG. Need a category too — the simplest path: change the dynamic route to `[category]/[slug]`. Check the existing route — if it's currently `[slug]/page.tsx`, you'll need to move it to `[category]/[slug]/page.tsx` AND delete the old file. If that breaks existing internal links, update them.
- Detail renders: title, category badge, deadline, budget, body markdown, "Contact the company" button (links to or starts a conversation thread).

---

## Task 6: Contact thread integration

`src/components/opportunities/contact-button.tsx` — client component:
- If user not logged in → link to `/login?next=...`.
- Else: on click, calls a small helper that either finds an existing `conversations` row for (company_id, initiator_id, subject="Opportunity: <title>") or inserts one, then redirects to `/dashboard/inbox/<conversation_id>` (or wherever the existing inbox routes live; if the inbox uses thread IDs as query params, follow that convention).

If existing inbox routing is unknown or complex, fall back to: button creates the conversation and toasts success with a link to `/dashboard/inbox`.

---

## Task 7: User dashboard — submission/edit

`/dashboard/opportunities`:
- Lists the user's own opportunities across all companies they own (resolve via `companies.owner_id = auth.uid()`).
- "New opportunity" button → `/dashboard/opportunities/new`.

`/dashboard/opportunities/new`:
- Form: title_en/fr, summary_en/fr, body_en/fr, category, sector, deadline, budget_min/max/currency, region, slug (auto from title_en if empty).
- Pick which of the user's companies to publish under (Select).
- Two buttons: "Save draft" → status=draft; "Submit for review" → status=pending_review.

`/dashboard/opportunities/[id]`:
- Edit form, only editable while status ∈ {draft, pending_review, rejected}. Show rejected_reason if status='rejected'. Resubmit moves back to pending_review.

---

## Task 8: Admin moderation queue

`/admin/opportunities`:
- Table of all opportunities, defaulting to status=pending_review at top.
- Each row links to `/admin/opportunities/[id]`.

`/admin/opportunities/[id]`:
- Renders the opportunity content read-only.
- "Approve" button → status=published, published_at=now() (via trigger).
- "Reject" button + text input for `rejected_reason` → status=rejected.
- Optional "Re-publish edits" if admin needs to edit content directly.

---

## Task 9: Nav + sidebar + verify + commit

- Modify `src/config/navigation.ts` — add `{ title: "Opportunities", href: "/opportunities", icon: Gavel }` top-level (if not already there).
- Modify `src/app/[locale]/admin/AdminLayoutClient.tsx` — add Opportunities sidebar entry.

Verify:
- `npx vitest run` — 15 tests pass.
- `npm run build` — clean.
- `npx eslint --quiet <S5 touched paths>` — no errors.

---

## Self-Review

- **Spec coverage:** §7 of master roadmap. opportunities table, 8 categories, public list/detail (T5), submission flow with verified-company + email-verified gate (RLS in T1, UI in T7), admin approval (T8), conversation contact (T6).
- **No placeholders:** every task has code or detailed acceptance criteria.
- **YAGNI:** No notification system, no email-on-approve, no rich text inside summary (just markdown body). Those can come later.

## Done definition

- 15+ tests pass; build/lint clean.
- Migration 00007 committed (apply behind 00003+00004+00005+00006).
- Public can browse `/opportunities` and `/opportunities/<category>/<slug>` bilingually.
- Verified company owner can draft, submit, edit until approved.
- Admin can approve/reject from `/admin/opportunities`.
- Contact button opens or creates a conversation thread.
