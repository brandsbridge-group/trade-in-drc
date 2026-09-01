# TradeInDRC — Completeness Gap Backlog

**Generated:** 2026-05-29
**Source:** 18 per-module completeness audits vs `docs/superpowers/audit/SPEC-DIGEST.md` (DASHBOARD.pdf 14 components + Requirements v1.0 15 modules + master roadmap S1–S9).
**Definition of DONE** (from spec digest): a flow is complete only if a real user can do it end-to-end through the UI, data persists via Supabase, RLS is enforced, EN/FR strings both present, loading/empty/error states handled, and the admin counterpart can moderate it.

This backlog deduplicates findings that recur across modules, ranks them by (severity → user impact → unblock value), and groups them into implementation clusters whose file sets are mostly disjoint so they can be built in parallel without merge conflicts.

---

## 1. Module status summary

| Module | Area | Status |
|---|---|---|
| Registration & verification flow | cross-cutting | partial |
| Roles, RBAC & admin guard | cross-cutting | partial |
| Secure messaging & anti-spam | cross-cutting | partial |
| i18n & 5 languages | cross-cutting | partial |
| Admin verifications (KYB queue) | admin | partial |
| Admin companies & trust | admin | partial |
| Admin content CMS (news/events/blog) | admin | partial |
| Admin data hub (prices/reports/legal/regs) | admin | mostly-complete |
| Admin opportunities | admin | mostly-complete |
| Admin users / taxonomy / settings | admin | partial |
| Dashboard home & company profile | user | partial |
| Dashboard products / services / media | user | partial |
| Dashboard opportunities & RFQ | user | partial |
| Dashboard inbox / analytics / settings | user | partial |
| Public directory & marketplace | public | partial |
| Public opportunities board | public | partial |
| Public data hub & trust center | public | mostly-complete |
| Public content / research / search / help center | public | partial |

**Headline:** Nothing is fully complete. Two modules (admin data hub, public data hub/trust) are mostly-complete with only polish gaps. The verification trust loop — the platform's flagship feature — is broken end-to-end across three modules. i18n is the single most pervasive defect class, appearing in ~14 separate surfaces.

---

## 2. Deduplicated findings that span modules

These were reported separately by multiple module audits and are collapsed to one work item each:

| Merged item | Reported in | Resolution |
|---|---|---|
| `companies.verified` column does not exist + approval never sets `verification_tier` | Registration, Admin-verifications, Admin-companies-trust | One fix: server-action approval that sets `status`/`verified_at`/`verification_tier`/`verification_summary`, drops the bogus `verified` key |
| Document-type enum mismatch (queue expects `tax_id/registry_cert/signature_circular`; DB allows `business_license/tax_registration/proof_of_address`) | Registration, Admin-verifications | Pick the DB CHECK enum as canonical, update `EXPECTED_DOC_TYPES` |
| Opportunities mega-menu links 404 (`/opportunities/tenders` etc.) | Dashboard-opp-rfq, Public-opp-board | One fix in `navigation.ts` → query-param form |
| `sector_id` is a raw free-text UUID input | Dashboard-opp-rfq, Public-opp-board | One sector `<Select>` in the opportunity form |
| Duplicate orphan RFQ board (`(public)/rfq`) with zero i18n | Dashboard-opp-rfq, Public-opp-board | One decision: retire or fully wire+translate the RFQ board |
| Stale "00004 not applied" TODO comments | Admin-companies-trust, Public-data-hub | Apply migration to live DB, regen types, delete TODOs |
| Verification-summary raw-JSON editor (no schema validation) | Admin-companies-trust, Public-data-hub | One structured check editor with Zod validation |
| RBAC role model only `user`/`admin` (spec needs 5 roles) | Roles/RBAC, Admin-users | One migration + helper functions + role `<select>` |
| Report/attachment is URL-paste only (no Storage upload) | Admin-data-hub, Public-data-hub | One upload widget pattern reused |
| Services have no write path / Services tab is a dead end | Dashboard-products, Public-directory | One services CRUD under dashboard |
| Spam/message moderation + report affordance | Secure-messaging, Inbox | One spam-report table + admin queue |
| ~14 hardcoded-English surfaces (admin verifications/users/companies/content/datahub/opportunities/taxonomy/settings; dashboard edit/products/inbox/analytics/settings/sidebars/opportunity-form/rfq; public legal/faq/sectors/contact/profile/product) | nearly every module | Grouped into per-area i18n clusters (C5, C6, C7) |

---

## 3. Findings by severity (post-dedup)

### CRITICAL (5) — breaks a core flow or security

1. **Verification approval is non-functional end-to-end.** Admin "Approve" writes to a non-existent `companies.verified` column (every approval throws) AND never sets `verification_tier`, so the flagship "Verified by Ministry" badge can never appear. `src/components/admin/decision-panel.tsx:84-99`; schema `00001` + `00004`. (merges Registration C1+C2, Admin-verifications C1)
2. **Verification documents cannot be uploaded.** Storage RLS rejects uploads because the path uses `temp-${userId}/...` but the INSERT policy requires the first folder segment to be a `companies.id` the user owns; the company row is also created after the upload. `src/lib/registration/actions.ts:46,57,61,68`; policy `00001:511-521`. (Registration C3)
3. **Admins cannot view uploaded KYB documents.** Private `company-documents` bucket is served via `getPublicUrl()` (403/404), with no signed URLs — reviewers literally cannot open the docs they must inspect. `actions.ts:57,61`; `document-viewer.tsx:64`; `admin/companies/[id]/page.tsx:311`. (Admin-verifications C2)
4. **Company edit form writes 9 columns that do not exist** (capacity, moq, lead_time, hs_code, certifications, markets, languages, tags, sector) — every Save throws "Failed to update company", so the spec's rich profile is unsavable. `src/app/[locale]/dashboard/companies/[id]/edit/page.tsx:127-141`. (Dashboard-home C1)
5. **Cmd+K palette is disconnected from FTS; the global search results page is unreachable from any UI.** The palette filters 6 hardcoded English nav links; typing a company/product term returns "No results". `command-palette.tsx`, `search-registry.ts`, `search-context.tsx`; FTS RPC only called by `/search/page.tsx`. (Public-content C1)

> Note: "Services have no dashboard write path" was rated critical by Dashboard-products; it is tracked as a HIGH-priority cluster item (C9) because it is net-new feature work, not a broken existing flow.

### HIGH (30) — a spec module is non-functional or shows mock data

**Auth / RBAC / security**
6. RBAC role model supports only `user`/`admin`; spec mandates 5 roles (Visitor, Congolese Company, International Business, Moderator, Super-Admin). `00001:44`, `status.ts:32-35`. (merges Roles H1, Admin-users H2)
7. RLS WITH CHECK gap: a company owner can self-promote their own `verification_tier`/`verified_at`/`status` (fake "Verified by Ministry"). `00001:181-185` owner_update has USING but no WITH CHECK. (Admin-companies H5)
8. Registration submit silently no-ops for unauthenticated visitors — fill 6 steps, click submit, nothing happens. `register/page.tsx`, `registration-form.tsx:27`. (Registration H6)
9. Admin Users page reads non-existent `profiles.email` — Email column blank, email search never matches. `admin/users/page.tsx:49,159,99-101`; `00001:42-49`. (Admin-users H1)

**Secure messaging / anti-spam (Req 6)**
10. Spam reporting queue entirely missing (Req 6). No table, no report button, no admin queue. (Secure-messaging H1, merges Inbox L admin-msg)
11. No rate-limiting and no CAPTCHA on contact/message send (Req 6 anti-scraping). (Secure-messaging H2)
12. Public company profile leaks raw `contact_email`/`contact_phone` to the browser payload for every verified company — defeats "no raw email". `companies/[id]/page.tsx:69`. (Secure-messaging H5)
13. Entire messaging UI hardcoded English despite EN/FR keys existing (Inbox/contact modal/thread). (Secure-messaging H4 — folded into i18n cluster C5/C6)

**Verification queue correctness**
14. Verification queue reads non-existent columns (`owner_email`, `sector`) — owner + sector always blank. `admin/verifications/page.tsx:66,148,153`. (Admin-verifications H3)
15. Document-type enum mismatch makes the queue's completeness dots always wrong. (merges Registration H4, Admin-verifications M)

**Admin companies / content / data**
16. Admin company list/detail read non-existent columns (sector, owner_email, email, phone, country) — info renders blank. `admin/companies/page.tsx`, `[id]/page.tsx`. (Admin-companies H1)
17. Events admin tab 404s — plural `/admin/content/events` href vs singular `event` route param. `content-tabs-nav.tsx:9` vs `[type]/page.tsx:7`. (Content H1)
18. Req-module-7 CMS scope (About / How It Works / Sectors / FAQ / Contact / legal pages + Help Center) entirely unbuilt — no `page_content` table, no admin editor. (Content H3, overlaps Public-content)
19. Admin opportunities has no audit trail (who/when/why of approve/reject) — Req 8 mandates timestamps + audit trails. `00007_opportunities.sql`, `review-actions.tsx`. (Admin-opportunities H1)

**Admin settings / taxonomy**
20. Settings page is a placeholder; no site settings, no homepage carousels, no featured profiles (Req 8). (Admin-users H3)

**Dashboard**
21. Sector never renders in dashboard — reads non-existent text column instead of `sector_id` FK join. `dashboard/companies/page.tsx:99`, `page.tsx:248`, `use-companies.ts:11`. (Dashboard-home H2)
22. Product Edit route 404 (no `[id]/edit/page.tsx`). `product-list.tsx:118`. (Dashboard-products H1)
23. Media management (logo, gallery, video embed, brochure PDF) absent (Req 4). (Dashboard-products H3)
24. No "responses / inbound interest" surface — Req 13 "sees responses" unmet for opportunities + RFQ. (Dashboard-opp-rfq H3)

**Analytics (Req 11)**
25. "Top search terms that led to profile" completely missing (named Req 11 differentiator). (Inbox H1)
26. "Search-result appearances" metric missing (Req 11). (Inbox H2)
27. "Contact Requests" stat permanently 0 — event never written. `contact-supplier-modal.tsx`. (Inbox H3)

**Public directory & marketplace (Req 5, 15)**
28. Verified References network (Req 15) entirely missing — no table, no UI. (Public-directory H1)
29. No full-text search input on any directory/marketplace list page (Req 5); orphaned i18n keys. (Public-directory H2)
30. Sidebar filters overwrite each other — facets do not compose. `sectors-filter.tsx`, `segments-filter.tsx`, `verification-filter.tsx`. (Public-directory H3)

**Public opportunities board (Req 5)**
31. Opportunities nav links 404 (`/opportunities/tenders` etc.). `navigation.ts:94,100,106`. (merges Public-opp H1, Dashboard-opp M)
32. Public board missing sector + deadline filters (spec requires category+sector+deadline). (Public-opp H2)
33. Duplicate orphan RFQ board at `(public)/rfq`, zero i18n, unreachable; two divergent opportunity systems. (merges Public-opp H7, Dashboard-opp-rfq H2)

**Public content / research / help (Req 7, 11, 14)**
34. FAQ page hardcoded English mock data, not in CMS. (Public-content H2)
35. Contact form does not persist — fake `setTimeout`, no submission/spam table, English-only. (Public-content H3)
36. Sectors page uses hardcoded mock data + fake counts, ignores the real `sectors` table; links use display name not id. (Public-content H4)
37. Help Center (Req 14) entirely missing — no route, no table, no admin section. (Public-content H5)

**i18n macro-gaps (Req 7) — folded into clusters C5–C7**
38. Legal pages (Terms/Privacy/Cookies) 100% hardcoded English on all locales. (i18n H1, Public-content M)
39. No `sitemap.ts` / `robots.ts` (Req 7 SEO sitemaps). (i18n H2)

### MEDIUM (38) — incomplete UX / polish / non-blocking correctness

- Dashboard layout has no server-side auth guard (relies on middleware only). (Roles M)
- `is_admin()` SECURITY DEFINER has no fixed `search_path` (lint: function_search_path_mutable). (Roles M)
- Configurable contact-reveal mode (direct/obfuscated/login-required) + click-to-reveal not implemented (Req 6). (Secure-messaging M)
- Permissive participant-insert RLS lets any user join arbitrary conversations. `00001:386-388`. (Secure-messaging M)
- No per-page/per-locale metadata, no hreflang alternates; single static title with typo "biligual". (i18n M)
- Status/tier changes create no `verification_reviews` audit row. (Admin-companies M)
- Verification-summary raw-JSON editor — no schema validation. (merges Admin-companies M, Public-data-hub M)
- Moderation writes go through browser client, not a server action (non-atomic review+update). (Admin-verifications M)
- Migration 00004 reportedly unapplied / stale TODOs; types lag. (merges Admin-companies M, Public-data-hub L)
- Report/attachment upload is URL-only, no Supabase Storage. (merges Admin-data-hub M, Public-data-hub L)
- Admin data-hub forms hardcode English strings. (merges Admin-data-hub M, Public-data-hub L)
- Cover image is URL-only (no upload) for content CMS. (Content M)
- Slug collisions unhandled — raw DB unique-constraint error. (Content M)
- Admin opportunities queue hardcodes English + shows EN titles to FR admins. (Admin-opportunities M)
- Opportunities queue sort buries `pending_review` behind rejected/published; no status filter. (Admin-opportunities M)
- Taxonomy console covers only sectors+categories — HS codes and tags missing (Req 8). (Admin-users M)
- User management lacks moderation actions + audit trail. (Admin-users M)
- Company edit page has no ownership guard + false save-success on 0-row update. (Dashboard-home M)
- `/dashboard/companies` list hardcodes English status badges. (Dashboard-home M)
- No upload validation/quotas on media (Req 4). (Dashboard-products M)
- Products table monolingual while services bilingual — inconsistent with bilingual-first. (Dashboard-products M)
- Admin cannot moderate `rfq_listings` (no admin RFQ queue). (Dashboard-opp-rfq M)
- Opportunity form has no required-field/Zod validation. (Dashboard-opp-rfq M, Public-opp M)
- `sector_id` is a raw UUID text input. (merges Public-opp M, Dashboard-opp L)
- Submission flow not gated to verified companies. (Public-opp M)
- RFQ board `trackEvent('rfq_board','public',...)` violates analytics CHECK — silent insert failure. (Inbox M)
- Inbox / analytics / settings / sidebar i18n. (Inbox M ×4 — folded into C6)
- Company profile has no "contact persons" tab/section. (Public-directory M)
- Missing location + certification filters (Req 5). (Public-directory M)
- No sort control / shareable-link sort (Req 5). (Public-directory M)
- Hardcoded English on company profile + product detail. (Public-directory M — folded into C7)
- `/market/[segment]` sector filter is a no-op. (Public-directory M)
- Public data-hub "Download" button hardcoded English. (Public-data-hub M — folded into C7)
- Price detail chart ignores the spec's 12-month window. (Public-data-hub M)
- `/trust/[companySlug]` queries by id not slug; no slug column. (Public-data-hub M)
- Legal pages i18n (Req 7) — folded into C7.
- News/Events/Blog sector filter sidebar is decorative (query never applies it). (Public-content M)
- Admin/dashboard ~15 hardcoded-English files (i18n) — folded into C5/C6.

### LOW (18) — nice-to-have

- Optional SMS OTP absent (spec marks optional). (Registration L)
- AuthProvider blocks app render while loading; no initial `getSession()`. (Registration L)
- Admin sidebar labels hardcoded English. (Roles L — folded into C5)
- `requireAdmin` swallows profile-fetch errors → masquerades as not_authorized. (Roles L)
- No message content length/validation; no admin conversation viewer. (Secure-messaging L)
- Admin content list has no loading/error state distinct from empty. (Content L)
- Body is markdown, not spec's TipTap JSON. (Content L)
- Admin list pages swallow fetch errors; no loading/error states. (Admin-data-hub L, Admin-opportunities L)
- CSV parser fragile (no header/quote/thousands handling). (Admin-data-hub L)
- Admin dashboard KPIs partial (only company status counts). (Admin-users L)
- No active-company switcher despite store field. (Dashboard-home L)
- Category is raw free-text "Category ID" input vs taxonomy picker. (Dashboard-products L)
- Opportunity/dashboard/admin sidebar nav labels hardcoded English. (Dashboard-opp-rfq L — folded into C6)
- No admin moderation of messages (folded into C2 spam queue).
- Public list query swallows errors (no error state). (Public-opp L)
- Market segment shelves limit-then-filter (can show fewer verified than exist). (Public-directory L)
- Stale 00004 TODO (folded into C8).
- PDF upload for reports (folded into C8 attachments).

---

## 4. Implementation clusters

Each cluster touches a mostly-disjoint set of files so they can be built in parallel without merge conflicts. Ordered by build priority. Effort is combined T-shirt size.

### C1 — Fix the verification trust loop (CRITICAL, effort L)
The platform's flagship feature, broken end-to-end. Do this first; everything trust-related depends on it.

**Covers:** Critical #1, #2, #3; High #14, #15; Medium (moderation server-action, status/tier audit row, doc-status dots); Medium (migration 00004 applied + types regen).

**Creates:**
- `supabase/migrations/000NN_verification_loop_fix.sql` (no `verified` column needed; ensures `verification_tier`/`verified_at`/`verification_summary` writable by admin only)
- `src/lib/verifications/actions.ts` (`'use server'` — atomic review insert + company status/tier/summary update, Zod-validated, `requireAdmin`)

**Modifies:**
- `src/lib/registration/actions.ts` (insert company first → upload docs under `${companyId}/...` → store storage path not public URL → insert `company_documents`)
- `src/components/admin/decision-panel.tsx` (drop `verified:true`, set tier on approve via server action, tier picker)
- `src/components/admin/document-viewer.tsx` + `src/app/[locale]/admin/verifications/[id]/page.tsx` (signed URLs via `createSignedUrl`)
- `src/app/[locale]/admin/verifications/page.tsx` (real columns via joins; fix `EXPECTED_DOC_TYPES` to DB enum; fix doc-status dots)
- `src/app/[locale]/admin/companies/[id]/page.tsx` (signed-URL doc link; status/tier audit row)
- `src/constants/status.ts` (canonical doc-type enum)
- `src/lib/supabase/types.ts` (regenerated)
- Remove stale 00004 TODOs in `src/app/[locale]/trust/[companySlug]/page.tsx`

**Deps:** none (foundational).

### C2 — Secure messaging hardening + anti-spam (HIGH, effort L)
**Covers:** High #10 (spam queue), #11 (rate-limit + CAPTCHA), #12 (PII leak); Medium (participant-insert RLS, contact-reveal mode); Low (message length validation, admin conversation viewer).

**Creates:**
- `supabase/migrations/000NN_message_reports_and_rls.sql` (`message_reports` table + RLS; tighten `conversation_participants` INSERT; `companies.contact_visibility` enum; content length CHECK; public-safe `companies` view excluding `contact_*`)
- `src/lib/messaging/actions.ts` (`'use server'` — create conversation/message with rate-limit + CAPTCHA verify)
- `src/app/[locale]/admin/messages/page.tsx` (moderation queue + read-only thread viewer)

**Modifies:**
- `src/components/messaging/contact-supplier-modal.tsx` (server action, CAPTCHA, track contact_request event)
- `src/components/messaging/message-thread.tsx` (report button, maxLength)
- `src/hooks/use-messages.ts` (route through server action)
- `src/app/[locale]/companies/[id]/page.tsx` (explicit safe column list / reveal-mode rendering — no `contact_*` in payload)

**Deps:** none (disjoint from C1). Coordinates with C7 on `companies/[id]/page.tsx` i18n strings (different lines).

### C3 — RBAC role model + admin/dashboard guards (HIGH, effort L)
**Covers:** High #6 (5-role model), #7 (owner self-promote RLS); Medium (dashboard server guard, `is_admin()` search_path, taxonomy HS/tags, user moderation+audit); Low (`requireAdmin` error branch, admin KPIs).

**Creates:**
- `supabase/migrations/000NN_rbac_roles.sql` (expand role model / `account_type`+`staff_role`; `is_moderator()`/`is_super_admin()`; harden `is_admin()` with `SET search_path`; owner_update WITH CHECK forbidding trust columns; refactor admin RLS to helpers)
- `supabase/migrations/000NN_taxonomy_hs_tags.sql` (`hs_codes`, `tags` tables)
- `supabase/migrations/000NN_audit_log.sql` (generic admin `audit_log`)
- `src/lib/auth/require-auth.ts`

**Modifies:**
- `src/app/[locale]/dashboard/layout.tsx` (await `requireAuth`)
- `src/lib/auth/require-admin.ts` (distinguish infra error vs not_authorized)
- `src/constants/status.ts` (role enum/type)
- `src/app/[locale]/admin/users/page.tsx` (role `<select>`, moderation actions — see C4 for email fix)
- `src/components/admin/taxonomy-editor.tsx` + `src/app/[locale]/admin/taxonomy/page.tsx` (HS/tags sections)

**Deps:** C7's owner WITH CHECK overlaps trust columns — sequence C1 migration first, then C3 migration (append-only numbering). Touches `users/page.tsx` and `taxonomy` shared with C4/C5 (coordinate line ranges).

### C4 — Admin settings, homepage curation, users-email, audit (HIGH, effort L)
**Covers:** High #9 (users email), #20 (settings/carousels/featured); Medium (user moderation+audit overlaps C3), KPI dashboards.

**Creates:**
- `supabase/migrations/000NN_site_settings_homepage.sql` (`site_settings`, `carousel_slides`, `featured_companies`)
- `src/lib/admin/users-actions.ts` (`'use server'` — join `auth.users.email`, suspend/disable via service-role)
- `src/app/[locale]/admin/settings/*` (general settings, carousel manager, featured picker)

**Modifies:**
- `src/app/[locale]/admin/users/page.tsx` (email via server action; replace placeholder)
- `src/app/[locale]/admin/page.tsx` (sector distribution + top profiles + search KPIs)
- Public homepage to consume carousel/featured

**Deps:** shares `admin/users/page.tsx` with C3 (role select vs email column — coordinate). Independent migrations.

### C5 — Admin i18n sweep (HIGH, effort M)
**Covers:** all admin hardcoded-English findings (verifications, users, companies, content CMS, data-hub forms, opportunities queue, taxonomy, settings, AdminLayoutClient sidebar).

**Creates/Modifies:**
- `src/config/messages/en.json` + `fr.json` (+tr/zh/es per S9): new `Admin.*` namespaces (verifications, users, companies, content, dataHub, opportunities, taxonomy, settings, nav)
- Wire `useTranslations`/`getTranslations` + locale-aware dates into: `admin/AdminLayoutClient.tsx`, `admin/users/page.tsx`, `admin/companies/page.tsx` + `[id]/page.tsx`, `admin/verifications/page.tsx` + `decision-panel.tsx` + `verification-detail.tsx`, `admin/content/*`, `admin/data-hub/**/*`, `admin/opportunities/page.tsx` + `[id]/page.tsx`, `admin/taxonomy/page.tsx` + `taxonomy-editor.tsx`, `admin/settings/*`

**Deps:** message-file additions can collide with C6/C7 — split namespaces per cluster (Admin.* here only). Component edits overlap C1/C3/C4 (same admin files) — run AFTER those land, or coordinate via distinct string vs logic edits.

### C6 — Dashboard i18n sweep (HIGH, effort M)
**Covers:** dashboard edit-company, products, inbox/[id], analytics, main settings, opportunity-form, rfq components, dashboard + sidebar nav labels.

**Creates/Modifies:**
- `src/config/messages/{en,fr,...}.json`: `Dashboard.editCompany`, `Dashboard.products`, `Dashboard.services`, `Inbox.*` extensions, `Analytics`, `Settings`, `Opportunities` (form), `RfqBoard`, `Dashboard.nav`
- Wire into: `dashboard/companies/[id]/edit/page.tsx`, `dashboard/companies/page.tsx`, `dashboard/products/*` + `product-form.tsx` + `product-list.tsx`, `dashboard/inbox/page.tsx` + `[id]/page.tsx` + `message-thread.tsx`, `dashboard/analytics/page.tsx`, `dashboard/settings/page.tsx`, `dashboard/opportunities/opportunity-form.tsx`, `components/dashboard/sidebar.tsx`, `components/dashboard/rfq-*`

**Deps:** message-file collision risk with C5/C7 (distinct namespaces). Component overlap with C8/C9 (same dashboard files) — sequence after feature work or coordinate.

### C7 — Public i18n + legal/SEO (HIGH, effort M)
**Covers:** High #38 (legal pages i18n), #39 (sitemap/robots); Medium (per-locale metadata + hreflang, public profile/product/data-hub hardcoded strings, news/blog sector filter is decorative — fix copy + query).

**Creates:**
- `src/app/sitemap.ts`, `src/app/robots.ts` (+ `NEXT_PUBLIC_SITE_URL`)
- `src/config/messages/{en,fr,...}.json`: `Terms`, `Privacy`, `Cookies`, `Metadata`, plus public profile/product/data-hub keys

**Modifies:**
- `src/app/[locale]/layout.tsx` (async `generateMetadata`, fix "biligual" typo, hreflang alternates)
- `src/app/[locale]/{terms,privacy,cookies}/page.tsx` (translate)
- `src/components/marketplace/company-tabs.tsx`, `src/app/[locale]/products/[id]/page.tsx`, `src/app/[locale]/data-hub/reports/[kind]/[slug]/page.tsx` (download key)
- generateMetadata on home/companies/[id]/products/[id]/opportunities

**Deps:** message-file collision with C5/C6 (distinct namespaces). `companies/[id]/page.tsx` shared with C2 (PII fix) — different concerns/lines.

### C8 — Public CMS pages + content hub polish (HIGH, effort L)
**Covers:** High #18 (page_content CMS: About/HowItWorks/Sectors/FAQ/Contact/legal), #34 (FAQ), #35 (Contact persist + spam), #36 (Sectors real data), #37 (Help Center); Medium (content sector filter wiring, data-hub download already in C7, chart 12mo, trust slug, attachment upload, verification-summary structured editor); Low (stale TODO, CSV parser, content loading state).

**Creates:**
- `supabase/migrations/000NN_page_content.sql` (`page_content`, `faqs`, `help_articles`, `contact_submissions`, `legal_pages`; `companies.slug`)
- `src/app/[locale]/admin/content/pages/*` (CMS editors)
- `src/app/[locale]/help/*` (index + detail)
- `src/lib/contact/actions.ts` (`'use server'` persist + Zod)
- structured verification-summary editor component

**Modifies:**
- `src/app/[locale]/{faq,sectors,contact}/page.tsx` (DB-backed + i18n)
- `src/app/[locale]/trust/[companySlug]/page.tsx` (slug query), `admin/companies/[id]/trust-profile-form.tsx` (structured editor)
- `src/components/data-hub/price-chart.tsx` + `src/lib/data-hub/queries.ts` (12mo window)
- report-form + content-form upload widgets; CSV parser; content list loading/error
- news/blog/events sector filter query wiring

**Deps:** C1 (trust columns) for the structured summary editor. Overlaps C7 on legal pages — decide DB-backed (C8) vs i18n-only (C7); recommend C8 owns legal page_content, C7 owns the rest.

### C9 — Marketplace completeness: services, media, references, filters, search (HIGH, effort L)
**Covers:** High (services write path #—, media mgmt #23, verified references #28, FTS search input #29, composing filters #30, product edit route #22, company sector render #21, edit-form columns #4); Medium (contact persons, location/cert filters, sort, market sector filter no-op, product monolingual, upload validation/quotas); Low (category picker, active-company switcher, shelf limit-then-filter).

**Creates:**
- `supabase/migrations/000NN_company_rich_profile.sql` (capacity/moq/lead_time/hs_code/certifications/markets/languages/tags; products name_en/fr; video_embed; storage buckets for gallery/brochure)
- `supabase/migrations/000NN_verified_references.sql`, `000NN_company_contacts.sql`
- `src/hooks/use-services.ts`, `src/app/[locale]/dashboard/services/*`, `components/dashboard/service-form.tsx` + `service-list.tsx`
- `src/app/[locale]/dashboard/products/[id]/edit/page.tsx`
- search box + location/cert filter components under `components/list-pages/`

**Modifies:**
- `dashboard/companies/[id]/edit/page.tsx` (real columns, sector select, ownership guard, save verification)
- `use-companies.ts` (sector join), `dashboard/companies/page.tsx` + `dashboard/page.tsx` (render sector)
- `companies/page.tsx` + `products/page.tsx` + `market/[segment]/page.tsx` (FTS query, composing filters, sort, sector filter fix)
- `product-form.tsx` (category select, image quotas, bilingual), `segment-shelf.tsx` (DB-side verified filter)

**Deps:** C1 (do its migration first for numbering). C6 owns dashboard i18n for these files — coordinate. Largest cluster; consider splitting C9a (rich profile + services) / C9b (search/filters/references).

### C10 — Opportunities & RFQ correctness (HIGH, effort M)
**Covers:** High #19 (audit trail), #24 (responses surface), #31 (nav 404), #33 (RFQ board decision); Medium (sector select, verified gate, form Zod validation, admin RFQ queue, opportunities sort/filter, rfq_board track CHECK); Low (sidebar nav i18n, public list error state).

**Creates:**
- `supabase/migrations/000NN_opportunity_moderation_and_responses.sql` (`opportunity_moderation_events`; responses model; analytics CHECK fix for rfq_board)
- `src/app/[locale]/admin/opportunities/[id]/actions.ts` (`'use server'` approve/reject + audit)
- `src/app/[locale]/admin/rfq/*` (RFQ moderation) OR retire `(public)/rfq`

**Modifies:**
- `src/config/navigation.ts` (fix 404 hrefs to query-param form)
- `dashboard/opportunities/opportunity-form.tsx` (sector select, Zod), `new/page.tsx` (verified-only gate)
- `dashboard/opportunities/page.tsx` + `dashboard/rfq/page.tsx` (responses column)
- `admin/opportunities/page.tsx` (sort pending-first, status filter, error state)
- `lib/opportunities/queries.ts` (sector+deadline filters, error result), `opportunities/page.tsx` (filters UI)
- `(public)/rfq/page.tsx` (retire or wire i18n — coordinate with C6 RfqBoard namespace)
- `track-event.ts` (error logging)

**Deps:** C6 owns `opportunity-form` / `rfq` i18n strings; C10 owns logic/validation — coordinate. `navigation.ts` is touched only here.

### C11 — Auth & registration polish (MEDIUM, effort S)
**Covers:** High #8 (register no-op for unauth); Low (SMS OTP, AuthProvider blocking render).

**Modifies:**
- `src/app/[locale]/(auth)/register/page.tsx` (server-redirect unauth → `/login?next=/register`)
- `src/components/registration/registration-form.tsx` (toast + redirect on `!user`; surface email-verified RLS error)
- `src/lib/auth/auth-provider.tsx` (render children always; seed `getSession()`)
- (optional) SMS OTP path — defer/document

**Deps:** none. Small, disjoint, good parallel filler.

---

## 5. Cluster build order & dependency graph

```
C1 (trust loop) ──► C8 (structured summary editor needs trust cols)
                └─► C9 (migration numbering)
C3 (RBAC migration) ──► must land after C1 migration (append-only)
C2, C4, C10, C11 ── independent
C5, C6, C7 (i18n) ── land AFTER their feature clusters (or coordinate string-vs-logic edits); namespaces disjoint
```

**Recommended sequence:** C1 → (C2, C3, C9, C10, C11 in parallel) → (C4, C8) → (C5, C6, C7 i18n sweeps last).

---

## 6. The single most important thing to build next

**C1 — Fix the verification trust loop.** It is the platform's reason to exist (a government-backed *verified* trade portal), it is currently broken in three independent ways (approval crashes, docs can't be uploaded, docs can't be viewed), and almost every other trust/badge/profile feature depends on a working approval that sets `verification_tier`. Until C1 lands, no company can ever be genuinely verified end-to-end through the UI.
