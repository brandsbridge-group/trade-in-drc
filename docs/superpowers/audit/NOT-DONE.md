# NOT-DONE — Consolidated Completeness Audit

**Generated:** 2026-05-29
**Scope:** Cross-area completeness verdicts (admin, dashboard, public, crosscutting) reconciled against `SPEC-DIGEST.md`, `GAP-BACKLOG.md`, and `VERIFICATION.md`.
**Method:** Static code inspection + spec/backlog cross-reference. Runtime DB application NOT verified (see Categories §3).

## Summary

| | High | Medium | Low | Total |
|---|---|---|---|---|
| **Genuine gaps (NOT done)** | 5 | 5 | 2 | 12 |
| **Intentionally deferred / out-of-scope** | 0 | 0 | 4 | 4 |
| **Partial (started, work remaining)** | — | — | — | 14 |

Done-count by area (for context): admin 13, dashboard 6, public 17, crosscutting 9.

---

## 1. NOT-DONE — prioritized

### HIGH — genuine gaps

1. **Business analytics missing its two named differentiators — search-result appearances + top search terms** (dashboard)
   `use-analytics.ts:11-24` selects only `event_type`/`entity_type` and returns `{profileViews, productViews, contactRequests}`; `analytics/page.tsx:65-79` renders exactly 3 StatCards; `en.json` Analytics namespace has only those 5 keys. `search_appearance` events ARE written server-side (`src/lib/search/analytics.ts`, `types.ts:32`) so the data exists — the business dashboard never surfaces it. SPEC-DIGEST Req 11. (GAP #25/#26)

2. **Product EDIT route does not exist** (dashboard)
   `dashboard/products` has only `new/` and `page.tsx` — no `[id]/edit/page.tsx` — yet `product-list.tsx` renders an Edit affordance that cannot route anywhere. `ProductForm` accepts an existing `product` prop for edit mode, but no route mounts it. (GAP #22)

3. **Req 4 media management (logo / gallery / video / brochure) unreachable through the UI** (dashboard)
   DB is fully provisioned (migration 00018: `company_media` table, `company-media` + `company-brochures` buckets w/ owner-write RLS, `products.video_embed`) but NO dashboard form writes to it. Company edit form (`companies/[id]/edit/page.tsx`, 562 lines) has no media sections; `product-form.tsx` only handles product images with no size/quota cap (`:91-113` uploads any `image/*`). Schema-only. (GAP #23 + "no upload validation/quotas")

4. **Services have no dashboard write path — Services CRUD unreachable** (dashboard)
   No `dashboard/services` route, no service-form/service-list components, no sidebar nav entry (`sidebar.tsx:21-30`). Services are public-read only (`marketplace/company-tabs.tsx:48`). (GAP §2 "Services tab is a dead end")

5. **Migrations 00011–00021 are statically-verified only — never applied to a live DB** (crosscutting)
   `VERIFICATION.md:114` deploy checklist still lists "Apply migrations 00011–00021 … `supabase db push`" as a NOT-yet-done step. RLS REVOKEs, WITH CHECK clauses, and SECURITY DEFINER `search_path` settings have no runtime proof. `types.ts` is hand-maintained and must be regenerated from the live DB post-migrate (`VERIFICATION.md:120`). Docker/`db reset` unavailable in this env.

### MEDIUM — genuine gaps

6. **Admin companies LIST page renders sector + owner email as永-blank `-` for every row** (admin)
   GAP HIGH #16 was fixed only for the DETAIL page. List page (`admin/companies/page.tsx:88-92`) fetches `.from('companies').select('*, profiles(full_name)')` via the BROWSER client — no `sectors()` join, no `auth.users` email resolution. The `Company` type declares `sector`/`owner_email` but the table has `sector_id` (FK) and email lives in `auth.users`. Renders `company.sector ?? '-'` (:217) and `company.owner_email ?? '-'` (:231) → always `-`. Detail page uses the correct `getCompanyForReview` path; list page was never migrated.

7. **Products are NOT bilingual + category picker is free-text, not a taxonomy selector** (dashboard)
   `product-form.tsx:19-23` schema = `{name, description, category_id}` — no `name_en/fr` / `description_en/fr`. `category_id` is a free-text `<Input>` (:196-201), not a `<Select>` bound to `categories`. Migration 00018 added the bilingual columns but the form never populates them → null on every new product. Contradicts Req 3 bilingual-first. (GAP MEDIUM/LOW)

8. **Req 11 commerce news / events / success-stories feed absent from analytics dashboard** (dashboard)
   `analytics/page.tsx` (85 lines) renders only the 3-stat grid; no news/events/stories section. SPEC-DIGEST Req 11.

9. **News/Events/Blog sector-filter sidebar is decorative — facet never reaches the query** (public)
   `news/page.tsx` passes `{ sectorId: sp.sector }` but `content/queries.ts listPublished()` only destructures `{ limit }` and has no `.eq('sector_id', ...)` and no `sectorId` field. Selecting a sector changes the URL + chip but returns the identical unfiltered list. (Directory/companies and `/market/[segment]` filters ARE applied DB-side — only content_items list pages are unwired.) (GAP Public-content M)

10. **No transactional email PROVIDER integration (Resend / SendGrid / SMTP / nodemailer)** (crosscutting)
    Email verification (`verify-email/form.tsx:24` → `supabase.auth.resend({type:'signup'})`) and password reset rely entirely on Supabase Auth's built-in mailer. Grep for resend/sendgrid/nodemailer/twilio/smtp → no provider, no env key, no transactional templates. SPEC-DIGEST Req 9 mandates an email provider. For a government portal, Supabase default SMTP (rate-limited, non-production-grade) is effectively unconfigured at scale.

11. **TR / ZH / ES locales are AI-translated, not human-reviewed** (crosscutting)
    `VERIFICATION.md:9-13`: 421 keys un-flattened + machine-translated programmatically across en/fr/tr/zh/es; no audit pass claims human review of TR/ZH/ES. For an official government-backed portal these three ship without accuracy/legal-terminology review. Quality gap, not a build blocker. (SPEC-DIGEST: TR/ZH/ES are later/deferred)

### LOW — genuine gaps

12. **Content CMS slug-collision handling absent — raw Postgres unique-violation surfaced to admin** (admin)
    `content-form.tsx:90-112` insert path: `.insert(payload).select().single(); if (error) throw error;`; catch (:110-112) shows `err.message` verbatim (e.g. `duplicate key value violates unique constraint content_items_slug_key`). No 23505 detection, no friendly i18n key, no pre-check/onConflict. Slug is auto-derived from `title_en`, so similar titles collide silently until insert fails.

13. **Admin dashboard "search queries" KPI not present** (admin)
    `admin/page.tsx` computes verification counts, totalViews, contactRequests, sectorDistribution, topCompanies — but NO query against any search-term source and no "top search queries" card. Req 8 names "search queries" as a KPI. Dovetails with search-term analytics gap (#25/#26).

---

## 2. Intentionally deferred / out-of-scope (NOT genuine gaps — flagged for completeness)

- **[LOW] Optional SMS OTP + SMS provider with logs** — sanctioned by spec ("optional"). `registration-form.tsx:18-20` in-code comment confirms deliberate deferral; no Twilio path, no SMS logs table, no phone-OTP step. (SPEC-DIGEST modules 1 & 9; GAP §3 LOW)
- **[LOW] Training & Documentation (admin manual + runbook PDF)** — SPEC-DIGEST module 10 marks it "out of code scope." No PDF/doc in `docs/`. Artifact not yet produced; not listed as a GAP, consistent with deliberate deferral.
- **[LOW] Content body is plain markdown/text in a Textarea, not spec's TipTap JSON** — intentional simplification. `StructuredBodyEditor` (JSON blocks) was built only for `page_content` CMS, not `content_items`. `content-form.tsx` stores `body_en`/`body_fr` as plain strings. (SPEC-DIGEST S3; GAP LOW)
- **[PARTIAL/DEFERRED] SEO sitemap excludes all dynamic detail pages** — `sitemap.ts` emits 16 static paths only and explicitly documents companies/products/reports as "intentionally excluded … dedicated dynamic sitemap later." `robots.ts` + per-locale `alternates.languages` present. Req 7 only partially met until a dynamic sitemap enumerates detail URLs. Documented post-ship scope, not a defect.

---

## 3. PARTIAL — started, with work remaining

### admin

- **Admin dashboard KPI completeness (Req 8)** — verification-status counts, sector distribution, top profiles (top-5 by analytics view count), totalViews + contactRequests all built with skeletons + error card + i18n (materially more than the backlog's "company status counts only" claim). **Left:** the "search queries" KPI — no top-search-terms card / search-events query.

### dashboard

- **Active-company switcher (Req 1, multi-company)** — working `<Select>` (bound to Zustand `activeCompanyId`) on Products, New Product, RFQ pages when `companies.length > 1`. **Left:** dashboard home + sidebar have no global selector; Analytics aggregates ALL `companyIds` rather than the active one — so analytics ignores the switcher. Add a global selector (sidebar/header) + scope analytics to the active company.
- **Companies-list sector render + status badge i18n (GAP #21)** — status badges fully i18n-wired in both list views; markup renders `{company.sector}`. **Left:** `use-companies.ts:11-17` does `select('*, verification_reviews(...)')` with NO `sectors` join, and there is no `sector` text column (only `sector_id` FK). So `company.sector` is undefined → sector subtitle blank in both home + companies list. GAP #21 NOT actually fixed in list views. Fix: join `sector:sectors(name_en,name_fr)` and render localized name.
- **Opportunity / RFQ responses surface (Req 13, GAP #24)** — DONE functionally. Migration 00021 `opportunity_responses` w/ owner-scoped RLS; opportunities + rfq pages query real rows, render counts/links. **Minor:** RFQ page counts responses to OPPORTUNITIES not `rfq_listings` specifically; both show counts/links not responder identities — acceptable for Req 13.
- **Company edit ownership guard + 0-row false-success** — DONE. Ownership guard (`:151-156`) redirects on mismatch; save does `.select('id')` and on `length===0` shows error + returns without success toast. Nothing left.
- **Company edit RICH PROFILE columns (CRITICAL #4)** — DONE. Migration 00018 added the 6 columns; edit page writes exactly those real columns + `sector_id` + syncs `company_tags`/`company_hs_codes`. Old "9 nonexistent columns" bug gone. Nothing left.

### public

- **SEO sitemap** — see Categories / §2 above (dynamic detail-page enumeration outstanding).

### crosscutting

- **Req 6 CAPTCHA (Cloudflare Turnstile)** — REAL implementation (server verify against `challenges.cloudflare.com/turnstile/v0/siteverify`, client widget) but **degrades to a no-op when env vars unset** — and they're optional/unset by default. `captcha.ts`: `if (!secretKey) { return { ok: true }; }`. **Left:** provision a Turnstile account, set `CAPTCHA_SECRET_KEY` + `NEXT_PUBLIC_CAPTCHA_SITE_KEY` in production, confirm enforcement.
- **Req 6 rate limiting (messaging + contact)** — implemented and counts PERSISTED rows (survives cold starts; 20 msg/hr, 10 threads/hr fail-closed; contact 5/hr per IP). **Left (hardening):** IP limit keys on `x-forwarded-for` (spoofable/shared behind NAT) — add an authenticated/secondary signal; ensure the edge strips client-supplied `x-forwarded-for`.
- **Req 6 three-mode contact reveal (direct / obfuscated / login_required)** — policy resolver (`contact-reveal.ts`, all 3 modes) + anon-gating fully implemented; company page reads `contact_visibility` (default `login_required`) and calls `resolveContactReveal`. GAP still flags MEDIUM. **Left:** confirm the `click_to_reveal` branch renders an interactive reveal button in `company-contacts.tsx`; confirm `direct`/`obfuscated` are settable per-company via owner/admin UI (mode-selection UI not verified).
- **VERIFICATION.md post-ship hardening (still open, explicitly NOT fixed):** (a) track-event `entity_id` UUID validation before insert — add `z.string().uuid()` guard; (b) optional hard RLS `WITH CHECK (company status='verified')` on opportunity insert — currently UI/app-level only, not DB-enforced; (c) drop the redundant dual admin UPDATE policy on `companies`. (Grounded in `VERIFICATION.md:108`; could not re-confirm in code this session due to intermittent harness output failure.)
- **Email-verify + password-reset round-trip never end-to-end smoke-tested** — UI exists (`verify-email/form.tsx:24` resend; forgot-password page + form) but delivery + token round-trip unproven, and both depend on email delivery with no production provider (see gap #10). `VERIFICATION.md:121` smoke checklist covers only the verification trust loop, not these round-trips. AuthProvider non-blocking render IS done (`auth-provider.tsx:31-35,58-62`, closes GAP LOW #174). **Left:** configure provider + run real verify + reset round-trip.

---

## 4. Categories — non-code items

### A. Environment / deploy actions still owed by the user
- `supabase db push` — apply migrations 00011–00021 to the live database (`VERIFICATION.md:114`).
- Regenerate `types.ts` from the live DB post-migrate (`VERIFICATION.md:120`); currently hand-maintained.
- Set transactional email provider env keys (Resend/SendGrid/SMTP) — none configured (gap #10).
- Set `CAPTCHA_SECRET_KEY` + `NEXT_PUBLIC_CAPTCHA_SITE_KEY` (Turnstile) — optional/unset by default → CAPTCHA is a no-op until set.
- Confirm edge strips client-supplied `x-forwarded-for` for the IP-based contact rate limit.

### B. Commit / push pending
- This audit (`NOT-DONE.md`) and any prior audit artifacts are uncommitted. (Repo was clean at session start on `main`; branch before committing per workflow rules.)

### C. Runtime DB application unverified (static-only)
- Migrations 00011–00021 verified by static checks only (`$$` counts, balanced parens, `IF NOT EXISTS`) per `VERIFICATION.md` Appendix:130. Docker / `supabase db reset` unavailable in this env. RLS REVOKEs, WITH CHECK clauses, SECURITY DEFINER `search_path` have no proof they apply cleanly against the real schema. (= HIGH gap #5.)

### D. AI-translation human review
- TR / ZH / ES message files (`config/messages/{tr,zh,es}.json`) are machine-translated, un-reviewed. Need human accuracy + legal-terminology review before an official launch in those languages. (= MEDIUM gap #11.)

### E. Roadmap non-goals (explicitly out of scope, NOT gaps)
- Optional SMS OTP / SMS provider with logs (spec-optional).
- Training & documentation deliverable (admin manual + runbook PDF — out of code scope).
- Dynamic-detail-page sitemap (documented post-ship scope).
- TipTap JSON body for `content_items` (intentional markdown simplification).
