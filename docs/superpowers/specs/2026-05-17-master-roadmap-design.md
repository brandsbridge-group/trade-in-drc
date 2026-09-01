# TradeInDRC — Master Roadmap Design

**Date:** 2026-05-17
**Source spec:** `docs/DASHBOARD.pdf` (14-component dashboard from stakeholder)
**Audience:** Engineering team continuing the build
**Status:** Brainstormed roadmap — each slice below becomes its own implementation plan via `superpowers:writing-plans`.

---

## 0. Snapshot of where we are

| Area | Status | Evidence |
|---|---|---|
| Next.js 16 + App Router + next-intl (EN/FR) | ✅ | `src/app/[locale]/`, `src/i18n/` |
| Supabase: profiles, companies, sectors, categories, products, rfq_listings, conversations, messages, verification_reviews, analytics_events, 3 storage buckets | ✅ | `supabase/migrations/00001_initial_schema.sql` |
| `is_admin()` SQL helper | ✅ | `00002_add_is_admin_helper.sql` |
| Auth: signup, login, AuthProvider, middleware session refresh | ✅ | `src/lib/auth/`, `src/lib/supabase/` |
| Email verification, password reset | ❌ | not implemented |
| Admin route guard (frontend) | ❌ | RLS-only; layout renders for any user |
| Homepage, About, Companies, Products, Opportunities, News, Events, Blog routes | ✅ scaffold | `src/app/[locale]/*` |
| News/Events/Blog wired to DB | ❌ | tables missing |
| Public Trust Center, badges, KYP, individual KYC | ❌ | only admin-side KYB |
| Data Hub (reports / prices / legal / regulations) | ❌ | not started |
| Marketplace sub-segments (services, manufacturers, importers, exporters, finance, logistics, government) | ❌ | only product listings |
| Global Cmd+K search | 🟡 | registry scaffold, search page empty |
| Languages TR / ZH / ES | ❌ deferred (per stakeholder decision) | only EN + FR shipped |
| Logo asset (final) | ❌ | placeholder |
| Dashboard area (user) | ✅ | `src/app/[locale]/dashboard/*` |
| Admin area | 🟡 | pages exist; no frontend guard; several placeholders |

**Estimated overall completion vs. PDF spec: ~30%.**

---

## 1. Guiding principles for the rest of the build

1. **Open-source / self-hostable only** (gov project — already enforced via Supabase + Next.js stack).
2. **Bilingual-first (EN/FR), additional languages deferred** — every new string lives in `src/config/messages/{en,fr}.json`. Skip TR/ZH/ES until the platform is content-complete.
3. **Lean CLAUDE.md** — folder-scoped CLAUDE.md files for area-specific rules; root stays a thin index.
4. **One slice = one spec = one plan = one PR group.** No mega-PRs.
5. **Dense, compact UI** (per memory: brand-color CTAs, minimal padding, info-dense cards).
6. **Stateful dashboards** (per memory: Zustand for client state + React Query for server state, already in place).
7. **RLS is the source of truth** for authorization; frontend guards are UX only.
8. **Every new table:** `id uuid pk`, `created_at`, `updated_at`, RLS enabled, `(name_en, name_fr)` for any user-facing text where bilingual matters.

---

## 2. Slice sequencing (recommended order)

Order is chosen to maximize unblockers first, content next, growth/discovery last.

| # | Slice | Why this order | Effort |
|---|---|---|---|
| **S1** | **Auth polish + admin guard** | Blocks safe public launch and admin work. Tiny. | S |
| **S2** | **Trust Center (public-facing) + verification badges** | Core trust play for a gov platform; reuses existing KYB pipeline; unlocks marketing the platform. | M |
| **S3** | **News / Events / Blog content wiring + admin CMS** | Three scaffolds already exist; one schema family covers all three; gives the home page real content. | M |
| **S4** | **Marketplace expansion (services + segment taxonomy)** | Extend `products` + add `services` + segment filters (manufacturer/importer/exporter/finance/logistics/government). | M-L |
| **S5** | **Opportunities Board v2** | Promote existing RFQ engine to full board with tenders/PPP/investment-call categories. | M |
| **S6** | **Data Hub / Market Intelligence** | New module: reports, price series, legal & regulation library. Heaviest content piece. | L |
| **S7** | **Global search (Cmd+K + /search results page)** | Needs prior slices' content to be valuable. | S-M |
| **S8** | **Logo + brand polish + landing page lift** | Cosmetic, last. | S |
| **S9** | **Languages: TR, ZH, ES** | Final i18n pass after all content modules stable. | M (translation-heavy) |

Each slice below has its own scope, data model, UI surface, completion criteria, and risks.

---

## 3. S1 — Auth polish + admin guard

**Scope**
- Email verification on signup (Supabase built-in; just wire the callback + UI states).
- Password reset flow (request + reset pages, both locales).
- `requireAdmin()` server helper used in `src/app/[locale]/admin/layout.tsx` — redirect non-admins to `/` with a flash toast.
- Account settings page lets user trigger password change and email change.

**Data model:** none — uses Supabase Auth.

**UI surface**
- `/(auth)/verify-email`, `/(auth)/forgot-password`, `/(auth)/reset-password`
- Inline banners in `dashboard/settings` for unverified-email and pending actions.

**Completion criteria**
- New signups receive verification email; unverified users cannot publish a company or RFQ (RLS check by `profiles.email_verified_at`).
- Password reset round-trip works in both locales.
- Visiting `/admin` as non-admin redirects in <100 ms, no flash of admin UI.

**Risks**
- Supabase email templates need branding + FR translation in the dashboard.
- Don't ship a custom email service; use Supabase SMTP first, swap later if needed.

---

## 4. S2 — Trust Center (public-facing) + verification badges

**Scope**
- Public `/trust` page explaining KYB / KYP / KYC tiers.
- Verification badge component on company cards & profile pages (`Verified`, `Pending`, `Premium` if we add tiers).
- Public Trust Report page per company: shows which checks passed, audit summary (not the raw documents).
- Optional **KYP** (Know Your Product) and **KYC** (individual) tables behind feature flags — only schema in S2; UI lands in a later slice if requested.

**Data model (delta)**
- Add `companies.verification_tier text check (...) default 'none'` — values: `none`, `basic`, `verified`, `premium`.
- Add `companies.verified_at timestamptz`, `companies.verification_summary jsonb` (public-safe summary).
- New table `kyp_checks` (id, product_id, type, status, summary jsonb) — schema only.
- New table `kyc_individuals` (id, profile_id, id_doc_status, address_status, ...) — schema only.

**UI surface**
- `/trust`, `/trust/[companySlug]`, badge component reused in directory + product cards.
- Admin: add tier selector to `/admin/companies/[id]`.

**Completion criteria**
- Public can browse `/trust/<company>` and see a clean summary; raw docs remain admin-only.
- Badge appears on company cards in `/companies`, `/products`, search results.

**Risks**
- Don't leak document URLs. RLS on `company_documents` already private — keep it.
- Translation discipline: every status string needs `name_en` + `name_fr`.

---

## 5. S3 — News / Events / Blog wiring + admin CMS

**Scope**
- Three content types backed by **one polymorphic table** (`content_items` with `type` enum: `news`, `event`, `blog`).
- Admin CMS pages under `/admin/content/{news,events,blog}` — list, create, edit, publish.
- Public pages use the existing scaffolds; just hydrate from DB.
- Rich text via TipTap (open-source, self-hosted) — store as JSON, render with serializer.

**Data model**
```
content_items (
  id uuid pk,
  type text check (type in ('news','event','blog')),
  slug text unique,
  title_en text, title_fr text,
  excerpt_en text, excerpt_fr text,
  body_en jsonb, body_fr jsonb,            -- TipTap JSON
  cover_url text,
  author_id uuid fk profiles,
  status text check (status in ('draft','published','archived')) default 'draft',
  published_at timestamptz,
  -- event-only:
  event_start_at timestamptz,
  event_end_at timestamptz,
  event_location text,
  -- meta:
  tags text[],
  sector_id uuid fk sectors null,
  created_at, updated_at
)
```
RLS: public read where `status='published'`; admin write.

**UI surface**
- Public: list pages + detail pages already exist; just bind queries.
- Admin: TipTap-based editor in `/admin/content/*` with EN/FR tabs.

**Completion criteria**
- An admin can publish a bilingual news item, blog post, or event in <2 min.
- Home page surfaces the 3 newest published items per type.

**Risks**
- TipTap JSON migration cost if we later swap editors — accept it.
- Event timezone handling: store UTC, render in Africa/Kinshasa default with toggle.

---

## 6. S4 — Marketplace expansion

**Scope**
- Add `services` content type (parallel to `products`).
- Tag every company with one or more **segments**: `manufacturer | importer | exporter | finance | logistics | government | public_corp | facilitation`.
- Marketplace landing `/market` shows per-segment shelves; existing `/products` becomes a filtered view.

**Data model**
- New table `services` (mirror of `products` minus `images[]` plus `service_type`, `delivery_mode`).
- New join `company_segments (company_id, segment_key)`.
- Seed `segments` reference table for i18n labels.

**UI**
- `/market` landing with segment tiles.
- Filters on `/companies`: segment, sector, verification tier.
- Company profile shows segments + services + products tabs.

**Completion criteria**
- A logistics company shows up on `/market/logistics`, `/companies?segment=logistics`, and its profile lists services.

**Risks**
- Taxonomy creep — lock segment list in seed migration; only admin can add new ones.

---

## 7. S5 — Opportunities Board v2

**Scope**
- Promote the existing `rfq_listings` engine to a full Opportunities Board.
- Add categories: `tender`, `ppp`, `investment_call`, `offer`, `demand`, `quotation`, `partner_search`, `project_launch`.
- Public submission flow for verified companies (subject to admin approval).
- Per-opportunity contact thread reuses `conversations`/`messages`.

**Data model**
- Add `opportunities` table (extends pattern from `rfq_listings`):
  ```
  opportunities (id, company_id, category enum, title_en, title_fr, summary_en, summary_fr,
                 deadline_at, budget_range jsonb, sector_id, status, created_at)
  ```
- Keep `rfq_listings` for backwards compat; new code writes to `opportunities`. Migration backfills.

**UI**
- `/opportunities` filters by category + sector + deadline.
- Dashboard `/dashboard/opportunities` — user manages own postings.
- Admin moderation queue at `/admin/opportunities`.

**Completion criteria**
- A verified company posts a tender; it appears publicly after admin approval; interested users start a conversation.

**Risks**
- Spam/abuse on public board — gate by verification tier + admin approval.

---

## 8. S6 — Data Hub / Market Intelligence

**Scope**
- Four content pillars: **Market Reports**, **Price Trends**, **Legal Guides**, **Regulations**.
- Reports and guides reuse the S3 `content_items` pattern but with their own table (or `type` extension) — decide during S6 planning.
- Price trends = time series with admin upload (CSV) + chart component.

**Data model**
- `reports` (id, kind enum [`market_report`, `legal_guide`, `regulation`], title_en/fr, body_en/fr, attachments[], sector_id, published_at).
- `price_series` (id, commodity, unit, sector_id) + `price_points` (series_id, observed_at, value).

**UI**
- `/data-hub` landing with 4 pillar tiles.
- `/data-hub/prices/[commodity]` with chart (Recharts — already in stack? confirm in plan).
- Admin CMS at `/admin/data-hub/*`.

**Completion criteria**
- A logged-out user can read a market report, view a copper price chart for the last 12 months, and download a regulation PDF.

**Risks**
- Time-series volume — chart pre-aggregates, no client-side full-dataset rendering.

---

## 9. S7 — Global Search (Cmd+K + /search)

**Scope**
- Cmd+K palette (`SearchProvider` already exists) returns results from: companies, products, services, opportunities, content_items, reports.
- Dedicated `/search?q=` results page with facets.
- Use Supabase Postgres FTS (multilingual: english + french configs) — no separate search service.

**Data model**
- Add `search_index` materialized view, refreshed on content changes via triggers, OR per-table `tsvector` columns. Decide in plan.

**UI**
- Cmd+K opens overlay with 5–10 instant results grouped by entity type.
- `/search` page mirrors with infinite scroll + filters.

**Completion criteria**
- Searching "copper" returns a mix of companies, products, opportunities, and a market report in <300 ms p95.

**Risks**
- Bilingual ranking — index both `_en` and `_fr` columns; use locale to bias.

---

## 10. S8 — Logo + brand polish

**Scope**
- Drop in stakeholder-provided final logo (replace placeholder).
- Audit color tokens vs. brand book in `docs/branding/`.
- Polish landing page sections.

**Data model:** none.

**Completion criteria:** stakeholder sign-off, Lighthouse perf still ≥ 90.

---

## 11. S9 — Languages: TR, ZH, ES

**Scope**
- Add three locales to `src/i18n/routing.ts`.
- Translate `src/config/messages/{tr,zh,es}.json`.
- Extend every bilingual content table with `_tr`, `_zh`, `_es` columns OR (preferred) refactor to a `content_translations` join table — decide in plan.

**Risks**
- DB shape decision is irreversible-ish — do this only after content modules are stable (S3–S6 done).

---

## 12. CLAUDE.md restructuring (cross-cutting)

To keep root CLAUDE.md lean, add **folder-scoped** CLAUDE.md files:

| Folder | What its CLAUDE.md covers |
|---|---|
| `src/app/[locale]/admin/` | Admin route guard, RLS reminder, never expose service-role key client-side |
| `src/app/[locale]/dashboard/` | Auth state assumptions, Zustand store conventions |
| `src/lib/supabase/` | Which client variant to use where (browser/server/middleware/admin) |
| `supabase/migrations/` | Migration numbering, RLS-by-default, naming |
| `src/i18n/` | How to add a key, message file structure, locale fallbacks |
| `src/components/ui/` | shadcn rules, no overrides, prefer composition |

Root CLAUDE.md becomes a short index pointing to these. Folder CLAUDE.md files are loaded only when Claude works in that folder, keeping context lean.

**Action in S1:** add the policy section + create the 6 folder CLAUDE.md stubs.

---

## 13. Open questions to resolve in each slice's plan

- **S2:** Do we want premium-tier badges from day one, or just `verified` vs. `none`?
- **S3:** TipTap vs. MDX-as-JSON — confirm in S3 plan.
- **S4:** Are services priced or always quote-on-request?
- **S5:** Approval SLA for opportunities (auto-approve verified tier-2+ companies?).
- **S6:** Where do price datasets come from initially — manual admin upload or API integration with DRC central bank?
- **S7:** Postgres FTS vs. external (Meilisearch / Typesense) — start with FTS, escalate only if needed.

---

## 14. Non-goals (explicitly out of scope for the roadmap)

- Mobile apps.
- Payments / escrow.
- Real-time notifications (deferred; use email digests in S5).
- ML-driven matching of buyers/suppliers.
- Custom CMS — we keep using Supabase + a thin admin UI.
- Replacing the i18n stack (next-intl stays).

---

## 15. Deliverable for next step

Once this roadmap is approved, the **first** spec to write a full implementation plan for is **S1 — Auth polish + admin guard** via `superpowers:writing-plans`.
