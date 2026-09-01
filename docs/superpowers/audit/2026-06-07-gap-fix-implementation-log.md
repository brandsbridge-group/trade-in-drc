# TradeInDRC — Gap-Fix Implementation Log

**Date:** 2026-06-07
**Source:** `docs/superpowers/audit/2026-06-07-implementation-gap-report.md`

This log records what was implemented to close the audited gaps, what remains, and
which migrations must be applied to production.

---

## STATUS UPDATE (later same day — supersedes sections below where they conflict)

Done by hand after the agent workflows stalled, each step build-verified:

- **O1 — opportunity threading + response loop:** ✅ complete (migration `00025`).
- **P1 — verification badges:** ✅ **now complete** — product listing **and** migration `00026` (search RPC returns `verification_tier`), `result-item` badge, `latest-block` + `explorer` (tabs/section) wired.
- **L1 — TR/ZH/ES:** 🟡 **foundation complete** — migration `00027` (`_tr/_zh/_es` columns via introspective DO-block), `pickLocalized()` helper, `pages.ts` 5-locale type. **Remaining:** ~68 call-site conversions + per-fetcher SELECT additions + admin authoring inputs + the actual translation content (content-ops; EN fallback graceful meanwhile).
- **X1 — admin i18n:** ✅ complete — `series-form` + `segments-form` strings moved into all 5 locales (`DataHub.admin.*`, new `AdminSegments` namespace).
- **T1 — quick wins:** ✅ middleware admin guard now uses `isAdmin()` (`staff_role`-aware); ✅ `VerificationTier` deduped (canonical in `constants/status.ts`, re-exported from `lib/trust/types`). ⏭️ seed `attachment_url`s intentionally skipped (cosmetic demo data, no real assets); auth test suite remains backlog.

**Migrations `00025`, `00026`, `00027` applied to production** via `supabase db push` (confirmed on remote).

**Still outstanding:** the large L1 remainder above. Everything else from the audit is closed.

---

## ✅ Done (committed, build green)

### O1 — Opportunity threading + response loop  *(closed 7 blocker/high gaps)*
Commit `447f3c7`.
- **Migration `00025`** — `conversations.opportunity_id` (FK → opportunities) + per-opportunity uniqueness (partial unique index: one company-level thread, one per opportunity) + index.
- `startConversation()` (`src/lib/messaging/actions.ts`) carries an optional `opportunityId`, scoping thread reuse correctly; all existing guards (auth, captcha, rate-limit, self-message, participant insert) preserved.
- `src/lib/messaging/threads.ts` — shared thread helper.
- `src/lib/opportunities/actions.ts` — `insertOpportunityResponse` server action with **email-verified gate + self-response prevention**, creating/linking a conversation.
- `src/components/opportunities/respond-dialog.tsx` — public response form; wired into the opportunity detail page and `contact-button.tsx`.
- Owner-side inbound-response list on `dashboard/opportunities/[id]`.
- Inbox (`use-messages.ts`, `dashboard/inbox`) shows opportunity context.

### P1 — Verification badges (partial)
Commit `447f3c7` + `f5f5f58`.
- `ProductCardDesign` accepts/renders `verificationTier`; `products/page.tsx` passes it. **Product listing — the primary surface — now shows trust badges.**
- `src/lib/search/types.ts` carries `verification_tier`.

### L1 — TR/ZH/ES foundation
Commit `f5f5f58`.
- **Migration `00027`** — introspective `DO`-block adds `_tr/_zh/_es` columns (same type, nullable) for **every** `_en/_fr` pair across all content tables. Complete and idempotent.
- `src/lib/i18n/pick-localized.ts` — `pickLocalized()` helper: active-locale → fr → en fallback (the canonical replacement for the silent-English `locale === "fr" ? _fr : _en` pattern).
- `src/lib/content/pages.ts` — dropped the hardcoded `Locale = "en"|"fr"`; now uses the canonical 5-locale type.

### T1 — Auth quick win
Commit `9fd0c9e`.
- `src/proxy.ts` middleware admin guard now selects `staff_role` and uses `isAdmin()` (was legacy `role='admin'` only — locked out moderators/super-admins).

## ⏳ Remaining follow-up (not yet done)

> Two autonomous multi-agent workflow runs to finish these stalled on this
> machine's agent watchdog; the items below were de-scoped to ship a green,
> coherent result rather than a half-applied broad sweep.

### P1 remainder (high/medium)
- Search RPC: `global_search` does not yet return `verification_tier` for products (needs a new migration `CREATE OR REPLACE` on the 00009 function) and `result-item.tsx` badge render.
- Home surfaces: `latest-block.tsx` / `explorer-tabs.tsx` don't query/show `verification_tier`.

### L1 remainder — **the large, partly content-ops part**
The schema + helper are in place, but rendering real translations requires:
- Replacing the **~68** `locale === "fr" ? _fr : _en` call sites with `pickLocalized()` — and, crucially, **adding the `_tr/_zh/_es` columns to each fetcher's SELECT** (most public fetchers select only `_en, _fr`). Public display components are the priority; admin-authoring forms are lower stakes (admins work in EN/FR).
- Admin authoring UI: add optional `_tr/_zh/_es` inputs to the ~8 content forms.
- **Translation content** itself (TR/ZH/ES values) must be authored/reviewed — not machine-fabricated for a government portal. Until present, `pickLocalized()` falls back to EN gracefully (no silent mislabeling once call sites are converted). See `supabase/scripts/backfill_translations_README.md` (to be written) for the backfill plan.
- Note: the roadmap explicitly **deferred** S9 ("skip TR/ZH/ES until content-complete"), so this remainder is consistent with the documented sequencing.

### X1 — Admin i18n (medium)
- `series-form.tsx` / `segments-form.tsx` still have hardcoded user-facing strings → move into all 5 message files.

### T1 remainder (low)
- `VerificationTier` type duplicated in `src/lib/trust/types.ts` and `src/constants/status.ts` — dedup.
- `seed.sql` reports (~lines 433–484) missing `attachment_url`.
- Auth test coverage (staff_role guard tests, client-form unit tests, E2E) — backlog.

## 🚀 Migrations to apply to production (BLOCKED — needs explicit authorization)

Applying schema to the live government DB was **not** auto-authorized. Run when ready:

```bash
supabase db push --linked   # applies 00025 + 00027
```

**Ordering matters:** the O1 code (committed) queries `conversations.opportunity_id`.
If the app is deployed before `00025` is applied, opportunity/inbox queries will
error in production. **Apply `00025` + `00027` before or together with the deploy.**
