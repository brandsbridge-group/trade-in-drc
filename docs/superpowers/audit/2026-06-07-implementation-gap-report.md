# TradeInDRC — Implementation Gap Report

**Date:** 2026-06-07
**Scope:** Roadmap slices S1–S9 plus per-module audits (Trust Center, Marketplace, Opportunities Board, Data Hub, Global Search, Messaging/Inbox, Admin CMS, Companies Directory, Products, News/Events/Blog, Auth, i18n, Brand/Logo).

## Executive summary

Twenty-four verified audit units were reviewed. The platform is substantially built: most modules are real, working code backed by deployed migrations, RLS policies, bilingual UI strings, and functional admin tooling — not placeholders. **8 units are complete**, **9 are mostly done** (real but with formalization or edge-feature gaps), **2 are partial**, **1 is a stub**, and **0 are entirely missing**. There are **15 blocker- or high-severity gaps** concentrated in three areas: (1) the **Opportunities Board response loop** is unfinished — schema exists but there is no submit UI, no insert action, and no owner-side response management; (2) **per-opportunity messaging** is structurally impossible because `conversations` is keyed only on `(initiator_id, company_id)`; and (3) **TR/ZH/ES localization** is a stub for all database-backed content — UI strings are fully translated, but no `_tr/_zh/_es` columns exist and 40+ files hardcode binary EN/FR fallback. Lower-severity themes: product/search verification badges not propagated to listing views, a handful of hardcoded admin strings, and missing completion artifacts (stakeholder sign-off, Lighthouse score) for the brand slice.

## Status table

| Requirement | Status | Corrected during verify? | # real gaps |
|---|---|---|---|
| S1 — Auth polish + admin guard | complete | no | 1 |
| S2 — Trust Center + verification badges | complete | no | 1 |
| S3 — News/Events/Blog wiring + CMS | mostly | no | 1 |
| S4 — Marketplace expansion | complete | no | 0 |
| S5 — Opportunities Board v2 | mostly | no | 4 |
| S6 — Data Hub / Market Intelligence | mostly | yes | 1 |
| S7 — Global Search (Cmd+K + /search) | complete | no | 0 |
| S8 — Logo + brand polish | mostly | no | 2 |
| S9 — Languages: TR, ZH, ES | stub | yes | 4 |
| MOD — Trust Center | mostly | no | 2 |
| MOD — Marketplace | complete | no | 0 |
| MOD — Opportunities Board | partial | no | 3 |
| MOD — Data Hub | mostly | no | 1 |
| MOD — Global Search | complete | no | 0 |
| MOD — Messaging / Inbox | mostly | no | 3 |
| MOD — Admin CMS | mostly | no | 3 |
| MOD — Companies Directory | complete | no | 0 |
| MOD — Products (verification badges) | partial | no | 6 |
| MOD — News/Events/Blog | complete | yes | 0 |
| MOD — Auth | complete | no | 6 |
| MOD — i18n infrastructure | mostly | no | 2 |
| MOD — Brand / Logo | mostly | no | 3 |

## Critical gaps (blocker / high)

### A. Opportunities Board — response submission loop is unimplemented (blocker × 3, high × 2)
The `opportunity_responses` table, RLS policies, FK to `conversations`, TypeScript types, and i18n keys all exist (migration `00021_opportunity_moderation_and_responses.sql`), but the user-facing flow does not.

- **No submit UI** on the public opportunity detail page. _Where:_ `src/app/[locale]/opportunities/[category]/[slug]/page.tsx` and `src/components/opportunities/` need a response form/dialog. **Severity: blocker.**
- **No server action to insert `opportunity_responses`** (with the RLS-enforced `is_email_verified` gate and self-response prevention). _Where:_ `src/lib/opportunities/` or a colocated action. **Severity: blocker.**
- **Response not wired to conversation creation** — `opportunity_responses.conversation_id` FK is defined (migration 00021 line 78) and RLS depends on it (lines 100–107), but no code ever populates it. `contact-button.tsx` (lines 36–77) only inserts `conversations` + `conversation_participants`. **Severity: blocker.**
- **No owner-side response management UI** — `src/app/[locale]/dashboard/opportunities/[id]/page.tsx` is 67 lines, only the edit form; no list of inbound responses, no query, no thread launch. **Severity: high.**

### B. Messaging — no per-opportunity threading (high × 3)
- `conversations` is keyed on `(initiator_id, company_id)` only; there is **no `opportunity_id` column**, so a user can have only one thread per company, not one per opportunity. _Where:_ `supabase/migrations/00001_initial_schema.sql` lines 336–343 (needs a new migration). **Severity: high.**
- **No UI to start a conversation with opportunity context.** `ContactButton` is used on the opportunity detail page without an `opportunityId`; `startConversation()` in `src/lib/messaging/actions.ts` has no `opportunityId` parameter. **Severity: high.**
- **Inbox cannot filter/display by opportunity.** `src/app/[locale]/dashboard/inbox/page.tsx` and `useConversations()` in `src/hooks/use-messages.ts` neither select nor render `opportunity_id`. **Severity: high.**

> Note: A and B are the same product surface (opportunity → contact → thread). The schema split that prevents per-opportunity threads (B) is the root that makes the response→conversation link (A) impossible to populate correctly. Fix B's schema first.

### C. S9 Languages (TR/ZH/ES) — database content unlocalized (blocker × 3, high × 1)
UI message files (`en/fr/tr/es/zh.json`) are complete and structurally identical, but database-backed content is stub-level for the three new locales.

- **No `_tr/_zh/_es` columns** on any bilingual table (`content_items`, `opportunities`, `page_content`, `faqs`, `help_articles`, services, products). Migrations 00005/00006/00007/00017 and all later ones define only `_en/_fr`. _Where:_ `supabase/migrations/` (new migration required). **Severity: blocker.**
- **`src/lib/content/pages.ts:16`** hardcodes `type Locale = "en" | "fr"`, overriding the correct 5-locale type in `src/config/locales.ts` and breaking the module for non-EN/FR. **Severity: blocker.**
- **40+ files use binary fallback** `locale === "fr" ? value_fr : value_en` (e.g. `opportunity-card.tsx`, `content-card.tsx`, `product-form.tsx`, `service-list.tsx`, `blog/[slug]`, `events/[slug]`, `news/[slug]`), so TR/ZH/ES silently render English. **Severity: blocker.**
- DB-stored content has **no localization path** for the three locales even though UI strings are done. **Severity: high.**

### D. Products & Search — verification badges not propagated to listings (high × 4)
The badge component and data exist, but listing/search surfaces don't display them. (Overlaps MOD-trust-center.)

- **`ProductCardDesign` doesn't accept/display `verification_tier`.** _Where:_ `src/components/design/product-card-design.tsx`. **Severity: high.**
- **`products/page.tsx` fetches `verification_tier` (line 57) but never passes it** to `ProductCardDesign` (props at lines 108–117). **Severity: high.**
- **`global_search` RPC doesn't return `verification_tier` for products.** _Where:_ `supabase/migrations/00009_global_search.sql` lines 147–154. **Severity: high.**
- **Search `ResultItem` renders only title + snippet**, no verification badge. _Where:_ `src/components/search/result-item.tsx`. **Severity: high.**
- (Medium siblings: `latest-block.tsx` and `explorer-tabs.tsx` don't query `verification_tier`.)

### E. S3 Home content surfacing (high × 1)
- Neither home variant surfaces the 3 newest published news/events/blog items. `LatestBlock` shows products + opportunities only. _Where:_ add a `LatestContentBlock` (calling `listPublishedByType` with `limit:3` per type) to `src/app/[locale]/page.tsx` and `src/app/[locale]/home-classic/page.tsx`. **Severity: high.**
> Caveat: MOD-news-events-blog (corrected to "complete") judged this conditional per spec — only required if the home design includes such a section. Treat E as a design decision to confirm with stakeholders, not an unambiguous defect.

### F. Brand sign-off artifacts (high × 2, S8 / MOD-brand-logo)
- **No stakeholder sign-off artifact** despite being an explicit S8 completion criterion. _Where:_ `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` line 277; deliverable belongs in `docs/branding/` or `docs/superpowers/audit/`. **Severity: high.**
- **No Lighthouse perf ≥ 90 measurement** despite the explicit mandate; no CI workflow exists (`.github/workflows/` absent). **Severity: high.**

## Partial / stub / missing modules

### S5 / MOD — Opportunities Board (mostly / partial)
- No public response submit form/dialog (blocker).
- No insert server action for `opportunity_responses` with verification + self-response gating (blocker).
- Response submission never links `conversation_id` (blocker/medium).
- No owner dashboard UI to view/manage inbound responses (high).

### S9 — Languages TR/ZH/ES (stub)
- Zero DB schema columns for the three locales (blocker).
- `pages.ts:16` Locale override breaks non-EN/FR (blocker).
- 40+ binary EN/FR fallback sites (blocker).
- DB content unlocalizable for TR/ZH/ES; only UI strings done (high).

### MOD — Messaging / Inbox (mostly)
- No `opportunity_id` on `conversations` (high).
- No opportunity-context conversation start UI / param (high).
- Inbox doesn't filter or display by opportunity (high).

### MOD — Products (partial)
- Six badge-propagation gaps (4 high, 2 medium) — see section D.

### S3 / S8 — see sections E and F above.

### MOD — Admin CMS / i18n (mostly) — hardcoded strings
- `series-form.tsx:115,126` — "New/Edit Price Series", "Deleting…" hardcoded (medium).
- `segments-form.tsx` — no `useTranslations`; "Save Segments" + toast strings hardcoded (lines 38, 44, 65, 67, 92) (medium).
- These violate the admin-folder rule "All admin copy must be bilingual via next-intl." `ReportForm` is the correct reference.

### Low-severity residue
- S1 / MOD-auth: `require-admin.test.ts` covers only legacy `role='admin'`, not `staff_role` moderator/super_admin branches; no UserAuthForm / VerifyEmailForm / ResetPasswordForm / AuthProvider unit tests; no E2E auth flow; `proxy.ts:56` uses legacy role check instead of `isAdmin()`.
- S2 / Trust: `VerificationTier` type duplicated in `src/lib/trust/types.ts` and `src/constants/status.ts`.
- S6 / Data Hub: seed.sql (lines 433–484) omits `attachment_url` for 7 reports — feature works, demo data thin.
- S8 / brand: color-token audit attestation not documented (medium).

## Looks complete (no real gaps)

- **S4 — Marketplace expansion** (segments, services, admin, RLS all real).
- **S7 — Global Search** (Cmd+K + /search RPC, debounce, analytics, bilingual).
- **MOD — Marketplace.**
- **MOD — Global Search.**
- **MOD — Companies Directory** (filtering, PII-safe contacts, registration + admin approval).
- **MOD — News / Events / Blog** (corrected to complete; markdown-by-design, not a TipTap gap).
- **MOD — Auth** (all flows + RBAC + RLS; remaining items are test-coverage only).
- (S1 and S2 are functionally complete; their single gaps are low-severity coverage/dedup items.)

## Recommended next slices (ordered)

1. **Slice O1 — Opportunity threading + response loop (sections A + B).** Highest concentration of blockers, single coherent surface. Add `opportunity_id` to `conversations` (new migration) → extend `startConversation()` and `ContactButton` to carry `opportunityId` → build the public response form + insert action (verification + self-response gate) that creates/links a conversation → add owner-side response list to `dashboard/opportunities/[id]`. Closes 7 blocker/high gaps.
2. **Slice P1 — Verification badge propagation (section D).** Add `verification_tier` to `ProductCardData`/`ProductCardDesign`, pass it from `products/page.tsx`, extend `global_search` RPC + `SearchResult` type + `ResultItem`, and wire `latest-block.tsx` / `explorer-tabs.tsx`. Closes 4 high + 2 medium; small, well-scoped.
3. **Slice L1 — Full TR/ZH/ES content localization (section C).** Largest effort: design `_tr/_zh/_es` column strategy (or a normalized translations table), migrate, fix `pages.ts` Locale type, and replace the 40+ binary fallbacks with a locale-aware selector helper. Sequence after O1/P1 since it touches the widest surface and benefits from a settled schema.
4. **Slice H1 — Home content surfacing (section E)** — quick `LatestContentBlock`, pending stakeholder confirmation that home should carry it.
5. **Slice X1 — Admin i18n cleanup** — move hardcoded `series-form.tsx` / `segments-form.tsx` strings into all 5 message files. Cheap compliance win, batch with P1.
6. **Slice B1 — Brand completion artifacts (section F)** — record stakeholder sign-off, run + commit a Lighthouse report (and color-token audit), ideally as a CI workflow. Non-code; unblocks S8 closure.
7. **Slice T1 — Auth + low-severity test coverage** — `staff_role` admin-guard tests, client-form/AuthProvider unit tests, E2E auth flow, `proxy.ts` `isAdmin()` fix, type dedup, seed `attachment_url`s. Maintenance backlog; do opportunistically.
