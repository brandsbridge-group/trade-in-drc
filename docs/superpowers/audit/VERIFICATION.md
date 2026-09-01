# TradeInDRC — Adversarial Verification Report

**Date:** 2026-05-29
**Role:** QA lead consolidation
**Scope:** 8 verification areas covering migrations, the verification trust loop, PII/messaging, RBAC, opportunities/RFQ, search/CMS, security, and i18n/UX.

This report consolidates 8 adversarial verification passes. Each pass independently audited a cluster of checkpoints against the actual source and migrations. Verdicts below are the auditors' findings; the QA lead has grouped, prioritized, and de-duplicated them.

> **Remediation applied — 2026-05-29 (post-audit):** All flagged items are now fixed and the build is green (`tsc` 0 errors, `next build` exit 0).
> - **P0 (i18n flat-dotted keys):** all 421 flat dotted keys un-flattened to nested objects across en/fr/tr/zh/es via `scripts/i18n-unflatten.cjs` (EN/FR parity preserved, 1755 leaves each); `Products.detail.*` and the other namespaces now resolve. An `onError` + `getMessageFallback` guard was added to `src/i18n/request.ts` so future missing keys throw in dev/CI and never render a raw key path in production.
> - **P1 (owner resubmission):** moved to a new service-role server action `resubmitCompanyVerification` in `src/lib/verifications/actions.ts` (verifies ownership via the cookie client, then writes `status='pending'` + the `resubmitted` review row through the service-role client); `dashboard/page.tsx` now calls it. `UPDATE(status)` was NOT re-granted to `authenticated`.
> - **P2 (reduced motion):** `useReducedMotion()` guard added to the `motion.div` in `products/[id]/page.tsx`; the broken loading/notFound copy is resolved downstream by the P0 fix.
> The non-blocking post-ship hardening notes below still stand.

---

## 1. Status table (area → overall verdict)

| # | Area | Overall verdict | Broken | Partial |
|---|------|-----------------|:------:|:-------:|
| 1 | migrations | **resolved** | 0 | 0 |
| 2 | verification-loop | **partial** | 1 | 0 |
| 3 | pii-messaging | **resolved** | 0 | 0 |
| 4 | rbac | **resolved** | 0 | 0 |
| 5 | opportunities-rfq | **resolved** | 0 | 0 |
| 6 | search-cms | **resolved** | 0 | 0 |
| 7 | security | **resolved** | 0 | 0 |
| 8 | i18n-ux | **broken** | 1 | 2 |

**Totals across all areas: 2 BROKEN, 2 PARTIAL.**

Two areas are not fully clean: `i18n-ux` (broken) and `verification-loop` (partial overall, with one broken checkpoint inside it). Everything else passed adversarial review.

---

## 2. Broken & partial checkpoints (grouped, prioritized)

Priority order: P0 = user-visible breakage on a shipped page (blocks ship). P1 = runtime failure in a core trust flow (blocks ship). P2 = a11y / polish gap (ship-after-fix).

---

### P0 — i18n-ux · Products detail page renders raw key paths / throws (BROKEN)

**Checkpoint:** "Swept files use t() and referenced keys exist in en.json AND fr.json"
**Area:** i18n-ux · **Verdict:** broken

**Evidence:** Ran the actual next-intl@4.7.0 `createTranslator` resolver against every accessed key in both `en`/`fr`. `products/[id]/page.tsx:109` does `useTranslations("Products")` then accesses `t("detail.loading")` (153), `t("detail.notFound")` (162), `t("detail.backToProducts")` (164), `t("detail.location")` (183), `t("detail.description")` (203), `t("detail.specifications")` (213), `t("detail.soldBy")` (231), `t("detail.contactCompany")` (257), `t("detail.signInToContact")` (263), `t("detail.relatedProducts")` (277), `t("detail.imageAlt")` (61). The live resolver returns `MISSING_MESSAGE` for ALL of these in BOTH `en` and `fr`.

**Root cause:** `en.json`/`fr.json` store these as FLAT string keys literally named `"detail.loading"` (the key name contains a dot), NOT as a nested object `detail: { loading: ... }`. next-intl resolves `t("detail.loading")` by nested traversal `Products → detail → loading`; since `Products.detail` is not an object, it throws. `request.ts` has no `onError`/`getMessageFallback` override, so dev throws and production renders the raw key path as visible text. Control: `t("title")` (a real flat key) resolves to "OUR PRODUCTS", isolating the dotted-key fault.

**Blast radius:** 421 flat-dotted keys exist across namespaces (Opportunities, Admin.verifications also use this pattern). Whether their components break is unverified, but it is the same risk class.

**Remediation:**
1. In `src/config/messages/en.json` AND `fr.json`, convert the `Products` namespace's 11 flat `detail.*` keys to a single nested `"detail": { "loading": ..., "notFound": ..., ... }` block, keeping the existing translated values.
2. Re-run the live resolver to confirm zero `MISSING_MESSAGE`.
3. Audit the other ~410 flat-dotted keys (Opportunities, Admin.verifications, etc.) the same way — for each namespace run `createTranslator` and call every key the component accesses; convert any that resolve `MISSING`.
4. Add an `onError` handler in `src/i18n/request.ts` so future missing keys fail loudly in CI instead of rendering raw key paths in production.

---

### P1 — verification-loop · Owner resubmission flow fails at runtime (BROKEN)

**Checkpoint:** "C1 cross-cutting: owner resubmission flow (dashboard/page.tsx) is broken at runtime"
**Area:** verification-loop · **Verdict:** broken

**Evidence:** `src/app/[locale]/dashboard/page.tsx` is a `'use client'` component using the browser/anon client (`createClient`, :93). `handleResubmit` (:87-126) does:
- (a) `companies.update({status:'pending'}).eq('id',companyId)` at :95-98 — but `status` is REVOKE'd from `authenticated` in `00011`, so this fails at runtime with `permission denied for column status`;
- (b) `verification_reviews.insert({admin_id:user.id, decision:'resubmitted', ...})` at :102-109 — but the `verification_reviews_admin_insert` RLS policy (`00001:455-459`) requires the caller to be `role='admin'`. A company owner is not an admin, so this INSERT is also denied.

Both writes fail; the `catch` (:115) surfaces a generic `toast.error` and the resubmission silently never persists. This contradicts the verifications-page "resubmitted" tab/filter (`verifications/page.tsx:27-29`, `hasResubmission`) which expects owners to create RESUBMITTED rows. Outside the 7 enumerated checkpoint files but squarely inside cluster C1 (the verification trust loop).

**Remediation:** Move the resubmission into a server action (e.g. in `src/lib/verifications/actions.ts`) that runs under the SERVICE-ROLE admin client AFTER verifying the caller OWNS the company (`auth.getUser()` + `companies.owner_id` check via the cookie server client), then performs the `status → pending` update and the `verification_reviews` insert with `admin_id` set to a system/owner-attributable id. Alternatively: (a) add an owner-scoped RLS INSERT policy on `verification_reviews` for `decision='resubmitted'` where the caller owns `company_id`, and (b) add a narrow owner path or a SECURITY DEFINER RPC for the `status → pending` transition that does not expose `tier`/`verified_at`.
**Do NOT** simply re-grant `UPDATE(status)` to `authenticated` — that reopens the self-promotion hole `00011` closed.

---

### P2 — i18n-ux · Missing prefers-reduced-motion guard on products detail (PARTIAL)

**Checkpoint:** "prefers-reduced-motion respected and durations follow MOTION.md"
**Area:** i18n-ux · **Verdict:** partial

**Evidence:** Global CSS rule is present (`globals.css` `@media (prefers-reduced-motion: reduce)` forces duration to `0.01ms` for `*`). `faq-client.tsx` correctly uses `useReducedMotion()` (22) and caps stagger. HOWEVER `products/[id]/page.tsx:191-194` uses a raw framer-motion `motion.div` with `initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} transition={{duration:0.3}}` and NO `useReducedMotion()` guard. The global CSS rule does NOT cover framer-motion because framer animates inline styles via JS, bypassing CSS `transition-duration`. MOTION.md §4 mandates EVERY animation respect `prefers-reduced-motion`. Duration `0.3s` itself is within the ≤300 ms enter budget — only the reduced-motion guard is missing.

**Remediation:** In `products/[id]/page.tsx`, import `useReducedMotion` from framer-motion, call `const reduce = useReducedMotion()` inside `ProductDetailPage`, and change the `motion.div` (191-197) to `initial={reduce ? false : { opacity: 0, scale: 0.97 }}` and `transition={{ duration: reduce ? 0 : 0.3 }}` — mirroring `faq-client.tsx`. Audit any other raw framer-motion added in the sweep for the same gap.

---

### P2 — i18n-ux · Detail loading/notFound states show broken copy (PARTIAL)

**Checkpoint:** "Loading/empty/error states on main new list/detail surfaces"
**Area:** i18n-ux · **Verdict:** partial

**Evidence:** State structure is present across surfaces: admin/companies has skeleton + empty states; dashboard/inbox has loading spinner + empty states; products list is server-rendered with an empty state; products/[id] HAS a loading state (:153) and a notFound state (:158-167, error path sets `notFoundState` at :128). CAVEAT: the products detail loading and notFound states render through the broken `Products.detail.*` keys, so they currently display raw key strings / throw. The state structure exists but its copy is broken by the P0 checkpoint above. Hence partial.

**Remediation:** No structural state work needed — fixing the `Products.detail.*` nesting (P0 remediation) makes these already-present states render correct copy. Optionally add an explicit error toast/banner on admin/companies fetch failure instead of silently falling through to the empty state.

---

## 3. Ready to ship?

**Verdict: ship-after-fixes.**

Seven of eight areas are fully resolved, including all the security-critical clusters (RLS coverage, service-role isolation, no hardcoded secrets, PII gating, self-promotion freeze, CAPTCHA + rate limiting). The two fixes that block ship are both small and well-localized:

- **P0 (i18n):** Re-nest the `Products.detail.*` keys in `en.json`/`fr.json` — a data-shape fix, no logic change. This alone clears the P0 and both i18n PARTIALs (the loading/notFound copy fix is downstream of it).
- **P1 (resubmission):** Route the owner resubmission through a service-role server action with an ownership check. Real code work, but contained to one handler + one new action.

Neither is a deep architectural problem. After these two land (plus the cheap reduced-motion guard), the build is shippable. The remaining auditor notes (track-event `entity_id` uuid validation, the optional hard `status='verified'` RLS check on opportunity insert, the redundant-but-harmless dual admin UPDATE policy on companies) are non-blocking hardening and can follow post-ship.

---

## 4. Before you deploy — checklist

- [ ] **Apply migrations 00011–00021** to the live database: `supabase db push`. The entire verification freeze, RBAC roles, taxonomy, CMS tables, messaging reports, and the analytics CHECK extension depend on these.
- [ ] **Fix P0:** Re-nest `Products.detail.*` (and audit the other ~410 flat-dotted keys) in `src/config/messages/en.json` + `fr.json`; add an `onError` handler to `src/i18n/request.ts`.
- [ ] **Fix P1:** Move the owner resubmission flow to a service-role server action with an ownership check (do not re-grant `UPDATE(status)` to `authenticated`).
- [ ] **Fix P2 (a11y):** Add a `useReducedMotion()` guard to the `motion.div` in `products/[id]/page.tsx`.
- [ ] **Set env var `NEXT_PUBLIC_SITE_URL`** (required for absolute URLs / canonical links / share targets).
- [ ] **Optionally set CAPTCHA env vars:** `CAPTCHA_SECRET_KEY` (server) and `NEXT_PUBLIC_CAPTCHA_SITE_KEY` (client). The flow degrades gracefully when unset, so this is optional — but production should enable it to stop spam on the public contact and messaging forms.
- [ ] **Regenerate TypeScript types from the live DB** after migrating: `supabase gen types typescript` (e.g. into `src/lib/supabase/types.ts`) so the new tables/columns (`staff_role`, `account_type`, `hs_codes`, `tags`, moderation tables, CMS tables) are reflected in the type layer.
- [ ] **Smoke-test the verification trust loop end-to-end:** owner registers a company → uploads docs → admin signs URLs and approves → owner resubmits (after P1 fix) → admin sees the RESUBMITTED tab.
- [ ] **Spot-check `prefers-reduced-motion`** on the products detail page in a reduced-motion OS setting after the P2 fix.

---

## Appendix — Resolved area highlights (for the record)

These passed adversarial review; recorded so reviewers don't re-litigate them:

- **migrations:** All 11 files have even `$$` counts, balanced parens, properly structured DO-blocks. Fully idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `pg_constraint` guards). RLS enabled on all 13 new tables. FK targets all pre-exist. The `analytics_events` CHECK rewrite (00021) is a strict superset of prior allowed values — no data-loss risk.
- **verification-loop (the 7 enumerated checkpoints):** Approval writes go through the service-role admin client; approval inserts an audit row then sets status/tier/verified_at (audit-first, abort-on-audit-failure — degrades safely). No code writes a non-existent `companies.verified` column. Registration creates the company row before uploads and stores storage PATHs (not `getPublicUrl`). Admins view docs via `createSignedUrl` on the private bucket. `requireAdmin` gates all 5 privileged actions.
- **pii-messaging:** Public profile reads from `companies_public` (omits contact PII, `security_invoker=on`, `status='verified'`); reveal gated via `resolveContactReveal` (hard-returns `login_required` for anon). Messaging actions are `'use server'`, rate-limited (20 msg/hr, 10 threads/hr, fail-closed), CAPTCHA-verified (graceful when unset). Report flow + admin moderation queue are read-only and RLS-enforced. Message length capped at 5000 at DB + Zod + client layers.
- **rbac:** Owner update WITH CHECK + column REVOKE freezes the four trust columns; `is_admin/is_moderator/is_super_admin` recreated with `SET search_path`; `account_type`/`staff_role` modeled and legacy admin migrated to `super_admin`; dashboard layout awaits `requireAuth`; `require-admin` separates unauth / not-staff / infra-failure; taxonomy manages `hs_codes` + `tags` under admin-only RLS.
- **opportunities-rfq:** Nav uses query-param hrefs (no 404s); admin approve/reject writes moderation audit rows via server action under `requireAdmin`; posters can see responses under owner-scoped RLS; opportunity form uses a sector Select + Zod and is gated to verified companies; `(public)/rfq` locale-aware redirects to `/opportunities`; `track-event` no longer swallows the analytics CHECK error.
- **search-cms:** Cmd+K queries the `global_search` FTS RPC and routes Enter to `/search?q=`; contact form persists via a real server action with honeypot + rate-limit; FAQ/sectors/help read real DB data; admin CMS editors persist under admin-only RLS.
- **security:** No client component imports the service-role admin client (all 8 importers are `'use server'`); `SUPABASE_SERVICE_ROLE_KEY` never reaches a client bundle / `NEXT_PUBLIC`; no hardcoded secrets; mutating admin actions gate with `requireAdmin` + Zod; RLS enabled on every new table; CAPTCHA secret read server-side only.
