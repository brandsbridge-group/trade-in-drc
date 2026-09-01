# Congolese vs International split — implementation plan

**Date:** 2026-07-28
**Status:** Plan — awaiting decisions D1–D7 before build starts
**Scope:** four customer asks (signup, registration split, promote split, contact details) reduced to four independently shippable workstreams
**Migrations reserved:** 00037, 00038, 00039 (latest applied is 00036)

---

## Context

Four customer asks arrived together. Investigation shows they are not four features — they are one classification concept (**Congolese vs International**) that has to be threaded through signup → company registration → promotion → admin review, plus two unrelated live defects that happen to sit on the same surfaces.

Everything below was verified against the working tree, not assumed.

### What is actually broken right now

```
  ASK                       REALITY IN THE CODE TODAY
  ────────────────────────  ──────────────────────────────────────────────
  "add a registration       No visitor can create an account. At all.
   option"                    /login "Sign up" ──▶ /register ──▶ /login
                              (redirect loop; register/page.tsx:20)
                              and the in-form toggle is inert
                              (user-auth-form.tsx:26-27 vs login/page.tsx:22)

  "split Congolese vs       One wizard, 5 steps, DRC-shaped. The split
   International            exists only as a client-side helper
   registration"            (types.ts isHomeCountry) and is never persisted.

  "split the promote        One page, one audience, one price (USD 3,000).
   page"                    The $6,000 tier does not exist in code or DB,
                            and the DB CHECK actively rejects it
                            (00023_premium_hardening.sql:39-40).

  "fix the contact          A placeholder phone "+243 XX XXX XXXX" and a
   details"                 wrong address are live in all 5 locales
                            (messages/*.json:2397-2399).
```

### The concept that unifies them

```
  signup ──▶ company registration ──▶ promotion ──▶ admin review
     │              │                     │              │
     │        declares profile      picks a plan    must see both
     │        (congolese |          priced per      and catch a
     │         international)       profile         mismatch
     │              │                     │              │
     └──────────────┴─────────────────────┴──────────────┘
                    ONE classification, persisted once,
                    on companies.registration_profile
```

Today that arrow is broken at every joint: signup captures nothing, registration computes the classification in the browser and throws it away, the public promote form hardcodes the Congolese price into a prose string, and no admin screen can tell the two apart.

### One thing nobody asked for that ships first

`profiles` has **no column-level UPDATE lockdown**. The RLS policy (`00010_fix_profiles_recursion.sql:14-18`) is row-level only, and `grep "ON public.profiles FROM" supabase/migrations/` returns nothing. Any authenticated user can `update profiles set role='admin'` against their own row. On a government portal this outranks all four customer asks. It is folded into WS1 because it shares a migration and a code path with signup.

---

## Workstream 1 — Unblock signup + close the privilege hole

**Ships alone. Customer-visible outcome: a visitor can create an account.**
Effort: M · Blocker.

Two independent bugs currently make account creation impossible, plus one security hole on the same table.

### Steps

1. **`supabase/migrations/00037_profiles_lockdown.sql`** — REVOKE `UPDATE (role, staff_role, account_type)` on `public.profiles` from `authenticated` and `anon`; GRANT `UPDATE (full_name, avatar_url)` back so users keep their own presentation columns. Update `handle_new_user()` to read an optional `account_type` from `auth.users.raw_user_meta_data` through a **whitelist** (`congolese_company` | `international_business`, anything else → NULL) so a crafted signup payload cannot inject past the existing `profiles_account_type_check`. Add a partial index on `account_type`. All statements idempotent; REVOKE of an absent grant is a no-op.

   **Pre-flight, mandatory:** confirm `src/lib/admin/users-actions.ts:251-267` (the only writer of `account_type`) uses the service-role admin client. If it uses the anon/authenticated client, admin user management breaks the moment this lands.

2. **`src/components/auth/user-auth-form.tsx`** — fix the controlled-mode bug at lines 26-27. Today `mode = externalMode ?? internalMode` and `setMode = onModeChange ?? setInternalMode`, so a caller passing `mode` without `onModeChange` freezes the form forever. Treat `externalMode` as the **initial** mode when no `onModeChange` is supplied; stay fully controlled when it is. This alone makes the existing toggle at line 173 work. Add a `returnTo` prop and use it instead of the hardcoded `ROUTES.DASHBOARD` at lines 72-74.

3. **`src/app/[locale]/(auth)/signup/page.tsx`** (new, ~40 lines) — mirror `login/page.tsx`: `AuthShell` + `AuthFormCard` + `<UserAuthForm mode="signup" returnTo={…} />`, footer link back to `/login`. No auth gate. A dedicated route beats `?mode=signup` for SEO, analytics, and linking from marketing surfaces.

4. **Repoint every "Sign up" affordance** — `login/page.tsx:18` (`/register` → `/signup`); `src/components/layout/navbar.tsx` add a Sign up button beside Sign in at :215 and :279, and change the logged-in dropdown at :200 from `/register` to `/register-company`; `src/components/layout/hero.tsx:82` and `src/components/layout/cta-section.tsx:46` — account CTAs → `/signup`, company CTAs → `/register-company`.

5. **Retire the old wizard** — `src/app/[locale]/(auth)/register/page.tsx` becomes a redirect (see **D2** for the target). Delete the 8 files in `src/components/registration/` (959 lines). Verified: `register/page.tsx:7` is the **only** referrer in the entire `src/` tree. Diff `step-documents.tsx` and `step-review.tsx` against the market equivalents *before* deleting — they may embed document/sector rules the new wizard does not replicate.

6. **Standardise the return-path param on `redirect`** — three names are emitted today (`next=` from `register/page.tsx:20`, `redirect=` from `proxy.ts:40`) and **none is consumed** by the login page. `callback/route.ts:29` already parses `redirect`, so that name wins. Extract the same-origin guard from `callback/route.ts` into `src/lib/url/safe-redirect.ts` rather than duplicating it. Have `login/page.tsx` and `signup/page.tsx` await `searchParams` and pass it through as `returnTo`.

7. **Close the email-confirmation loop** — `signUp()` at `user-auth-form.tsx:43` passes no `emailRedirectTo`, so Supabase falls back to the project Site URL and drops the locale. Set it to `${origin}/${locale}/callback?redirect=…`, exactly the pattern already proven at `forgot-password/form.tsx:21`. Render the unused `Auth.verifyEmail.body` key on `verify-email/page.tsx`. Give `resend` the same `emailRedirectTo`. Add a `type === 'signup'` branch to `callback/route.ts`.

8. **i18n** — new `Auth` keys (`signUpTitle`, `signUpDesc`, `createAccount`, `termsNotice`, `verifyEmail.checkSpam`) and `Nav.signup`, in **all five** locale files in the same commit. Reuse the existing `signUp`/`signIn`/`noAccount`/`hasAccount`/`successRegister`/`errorAccountExists` — the `Auth` namespace is at exact 5-locale parity today and must stay there. Correct `CLAUDE.md`'s two stale references: `src/components/auth/user-auth-modal.tsx` does not exist, and middleware is `src/proxy.ts` not `src/middleware.ts`.

**Deliberately NOT in this workstream:** an account-type selector at signup. See **D3**.

---

## Workstream 2 — Contact details, one source of truth

**Ships alone. Customer-visible outcome: the fake phone number is gone.**
Effort: S · Blocker (wrong data live in production, in 5 languages).

### Steps

1. **`src/config/contact.ts`** (new, ~35 lines) — export `PLATFORM_CONTACT` with `email`, `emailHref`, `phone` (display form, spaced), `phoneHref` (`tel:` form, unspaced — iOS/Android dialers require it), `addressLines[]`, `addressText`. Export `AGENCY_CONTACT` (BrandsBridge Group SARL) as a **separate named constant** so the two identities can never be confused at a call site. Not in `site.ts` — that file is branding/nav, and both files stay small and greppable.

2. **Delete `ContactPage.emailValue` / `phoneValue` / `addressValue`** from all 5 catalogs (line 2397-2399 in each — the files are structurally identical). Keep the *label* keys, which genuinely need translating. A street address and a phone number are not translatable content; leaving them in the catalogs is precisely what let `+243 XX XXX XXXX` survive in five files. Re-grep the three key names immediately before deleting — verified today that `src/app/[locale]/contact/page.tsx:99,109,119` are the only consumers, but the working tree has 7 uncommitted marketplace components.

3. **`src/app/[locale]/contact/page.tsx`** — read from the config and make email/phone **actionable** (`mailto:` / `tel:`), which they are not today. Drop `whitespace-pre-line` and map `addressLines`. Standard 150 ms hover colour transition per `docs/MOTION.md`; no new motion recipe needed.

4. **`src/components/home/site-footer.tsx`** — add a compact 3-line contact block under the logo/tagline (:52-55). The footer is the highest-traffic surface on the site and shows no contact details at all today. Only a section *label* goes into i18n; values stay in config. If this pushes the file past ~140 lines, extract `src/components/home/footer-contact.tsx`.

5. **Sweep** — `grep -rn "XX XXX\|Ministry of Commerce\|Ministère du Commerce\|Ticaret Bakanlığı\|Ministerio de Comercio\|商务部" src/` must return zero. Drop the stale `Navbar.poweredBy` key (line 32 in all 5) — the label was removed from the navbar in commit 85361b6.

**Blocked on D1** (BrandsBridge vs TradeInDRC) and **D7** (legal@/privacy@ mailboxes). Steps 1–4 can be built with the platform values; step 5 and any agency-branded surface waits.

---

## Workstream 3 — International registration path

**Ships alone. Customer-visible outcome: an international company gets its own 7-step wizard.**
Effort: L.

**Architectural decision: ONE wizard shell, branched step list.** Not a parallel wizard. The shell (`register-wizard.tsx:45-199`) is pure plumbing — plan state, `stepIndex`, `missingFields()`, the re-validate-all submit loop, auth redirect, success screen. Forking it duplicates ~150 lines and two divergent submit paths against one server action. Only the **step list** and the **step body** differ.

### Steps

1. **`constants.ts` + `types.ts`** — add `REGISTRATION_PROFILES = ['congolese','international']`; rename the existing list to `CONGOLESE_WIZARD_STEPS` (keep the 5 keys so existing i18n survives); add `INTERNATIONAL_WIZARD_STEPS` (7) and `stepsForProfile()`. Add `INTL_LEGAL_FORMS` (the current `LEGAL_FORMS` is OHADA-only — `sarl`, `sarlu`, `scs` — an international company has no correct option but "other"), `DRC_PRESENCE`, `DRC_ENTRY_TIMELINE`. Extend `RegisterFormData` with `profile`, `addressStreet`, `headOfficeCountry`, `contactEmail`, `contactDialCode`, `contactPhone`, `drcPresence`, `drcTimeline`, `drcTargetProvinces`, `drcGoals`, `mainMarkets`. Replace `requiredForStep(step, data)` with `requiredForStep(profile, step, data)` over two private tables. Keep `isHomeCountry()` for label flipping inside the Congolese path only.

2. **`profile-chooser.tsx`** (new) — two selectable cards, same visual grammar as `tier-cards.tsx`. On select: set profile, reset form (`country` preset to `HOME_COUNTRY` for Congolese, blank for international), reset `stepIndex`. Motion per `docs/MOTION.md` — ≤180 ms hover, no layout-shifting transforms.

3. **`register-wizard.tsx` + `stepper.tsx` + `wizard-step-body.tsx`** (new) — wizard gains `profile` (null until chosen) and `stepsForProfile()` replaces every `WIZARD_STEPS` import **including the submit re-validation loop**. `stepper.tsx` currently imports the module-level constant directly (:6, :27) — it must take `steps` as a prop. The 18-line JSX switch moves into `wizard-step-body.tsx` to keep the wizard under 300 lines (it is at 199 today).

4. **`src/components/register/market/intl/step-intl-{company,business,market,contact,plan}.tsx`** (5 new files, ~80-140 lines each) — all compose the existing `field-kit.tsx` primitives; no new primitives. `documents` and `review` steps are reused as-is. Field lists per **D4**.

5. **`register-company-actions.ts`** — add `profile` to the payload; convert the DRC-only `superRefine` (:60-77) into a profile switch. Write `address` (the column exists and is **never written today**) and `registration_profile`. Set `province: null` for international. Extend the `registration_intake` JSON. Extract `buildDescription()` + the intake builder into `register-intake-payload.ts` — the file is at 198 lines and will breach 300 otherwise.

6. **`supabase/migrations/00038_companies_registration_profile.sql`** — see Migrations below.

7. **Admin can finally review it** — this is the quiet blocker. `verification_summary.registration_intake` is **write-only**: grep confirms the only two references in `src/` are both in `register-company-actions.ts` (:116 comment, :153 write). No admin screen parses it. Add `src/components/admin/registration-intake-panel.tsx` (defensive parse, mirroring `src/lib/trust/verification-summary.ts`), render it on both `admin/companies/[id]` and `admin/verifications/[id]`. Add `country, address, registration_profile` to the select in `src/lib/verifications/actions.ts:549-552` and to `getVerificationQueue()` at :426-432 — a reviewer with no country on screen will reject valid international registrations, because `EXPECTED_DOC_TYPES` implies the Congolese RCCM/NIF set. Add a profile badge + filter to `admin/companies/page.tsx`.

   **Verify before shipping:** `admin/companies/[id]/trust-profile-form.tsx:136` writes `verification_summary` wholesale. If it replaces rather than merges, it silently destroys `registration_intake`.

8. **i18n** — ~80 new keys under the **existing** `RegisterCompany` namespace (no new namespace, so `useTranslations('RegisterCompany')` keeps working), all 5 files in the same PR.

**Deliberately NOT in this workstream:** redesigning the Congolese path. See **D5**.

---

## Workstream 4 — Promote page split

**Ships alone. Customer-visible outcome: three tabs, two international tiers, the $6,000 plan exists.**
Effort: L.

### Steps

1. **`src/lib/pricing/plans.ts`** (new) — `PROMOTION_PLANS` keyed by slug (`congolese` 3000, `international` 3600, `international_strategic` 6000) carrying audience, price, accent token, i18n key. Imported by the page, the apply action, `pricing/actions.ts` and the admin label helper so the price literal exists **exactly once**. Today it exists in three places, one of which is prose: `premium-apply-actions.ts:31` hardcodes `"Premium Local Partner application (USD 3,000/year)"`.

2. **`src/lib/pricing/compare-matrix.ts`** (new) — `COMPARE_ROWS` as **keyed** objects with cell values of `boolean | { valueKey }`. This kills two bugs at once: the current `PLAN_MATRIX` is boolean-only (cannot express "Featured", "Up to 3", "Semi-Annual") and is **positionally coupled** to the i18n rows array (`compare-table.tsx:7-8` literally comments "Order MUST match"). Translating 14 rows into 5 locales under the current design will silently mis-shift ✓ cells in FR/ES/TR/ZH.

3. **`audience-tabs.tsx`** (new) — client island over the existing shadcn Tabs; RSC panels passed as children so plan content stays off the client bundle. Tab indicator ≤180 ms, panel enter ≤300 ms, `prefers-reduced-motion` respected.

4. **`promotion-plan-card.tsx`** (new) — data-driven; OPTION badge, title, price, bullets, blue/gold accent via a named class map (no inline hex), CTA, "Best for" footnote.

5. **Rework the existing sections** — `compare-table.tsx` becomes data-driven and 2-column; `pricing-hero.tsx` becomes the light hero with stat cards and loses the embedded compare table and the "Starting from USD 3,000" block (price now lives on the cards); `assistance-band.tsx` becomes the 3-CTA navy bar reading contact from **`src/config/contact.ts`** (WS2 — do not hardcode the number); `benefits-strip.tsx` repoints to the design's 6 items; `what-you-get.tsx` + `how-it-works.tsx` move into a `local-plans-panel.tsx` so the Congolese content survives verbatim.

6. **Thread the chosen plan through the apply flow** — `PremiumApplyButton` has **no `plan` prop** today, so both CTAs are indistinguishable. Add a required plan slug, validate with `z.enum` against `PROMOTION_PLANS`, and write it to the new `business_requests` columns. Delete `BASE_MESSAGE`'s price string.

7. **`supabase/migrations/00039_promotion_plans.sql`** — see Migrations below.

8. **Admin** — `premium-requests-table.tsx:76-77` is a binary ternary (`plan === 'congolese' ? … : planInternational`); a third plan silently renders as "International". Replace with a record lookup. Surface `promotion_plan` + amount + the long-invisible `reference` (exists since 00030, never displayed — support cannot currently find a request by the code quoted to the submitter) on `admin/requests/page.tsx`. Add a **plan-vs-profile mismatch warning** on the premium queue: an international company applying on the $3,000 Congolese plan is caught nowhere else.

9. **`src/components/pricing/premium-cta.tsx`** — verified unreferenced (only its own definition file matches). Delete per NO_DEAD_CODE unless **D6** revives it.

10. **i18n** — the largest single chunk of this batch. Restructured `Premium` namespace (name kept — see **D6**), keyed compare rows, 3 plan trees, tabs, CTA bar. FR is a genuine customer-facing locale on a bilingual government portal and must be a real translation, not an English fallback.

---

## Sequencing

```
  WS1  signup + profiles lockdown   ──▶ ships first, alone
   │   (nobody can register today; anyone can self-promote to admin)
   │
   ├──▶ WS2  contact truth          ──▶ ships in parallel, no shared files
   │        (fake phone live in 5 languages; S effort, high visibility)
   │
   ├──▶ WS3  international wizard   ──▶ needs WS1 (anonymous users must
   │        reach signup instead of dead-ending on the auth toast)
   │
   └──▶ WS4  promote split          ──▶ needs WS2 (CTA bar reads contact
            config) and WS3 (profile drives which plan is offered)
```

**Why this order.** WS1 is the only item where a real user is blocked from the product entirely, and it carries the security fix. WS2 is S-effort and removes visibly wrong data — cheap, high customer-confidence return. WS3 before WS4 because the promote page's audience concept is downstream of the registration profile; building the tabs first would hardcode an audience split that WS3 then has to re-derive.

WS1 and WS2 share **zero files** and can run concurrently. WS3 and WS4 both touch the 5 locale catalogs — sequence them, do not parallelise, or the JSON merges will be miserable.

---

## Decisions needed before building

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | **Contact identity conflict.** The customer says `support@tradeindrc.com`; the services design says `sales@brandsbridgecd.com`; the ASK-4 brief says `info@brandsbridgecd.com`. Three addresses, two domains. | (a) Platform contact everywhere, BrandsBridge only as operator line · (b) BrandsBridge everywhere · (c) Both side by side | **(a).** Two email domains presented as equally valid support channels makes the platform look like a reseller front and splits inbound mail. BrandsBridge appears as "Operated by BrandsBridge Group SARL" in the footer and on the future /services agency card only. The phone `+243 811 835 930` is shared, so one number serves both. **Also confirm sales@ vs info@ — the two source documents disagree.** |
| **D2** | **What does `/register` become?** | (a) redirect → `/signup` · (b) redirect → `/register-company` | **(a).** "Register" in a visitor's mind is *create an account*, and company registration already owns a clear URL. All internal company CTAs get repointed anyway; the old `/register` was behind an auth wall so anonymous inbound links never worked. Low confidence — the customer's phrase "registration option" is genuinely ambiguous. |
| **D3** | **Ask for account type at signup?** | (a) email+password only · (b) add a Congolese/International selector | **(a).** It asks a user to classify themselves before they know what the classification means, and the registration wizard asks it again with full context. Keeps the blocker fix minimal. The DB path ships in 00037 regardless, so (b) is a 1-file change later. |
| **D4** | **International steps 2–4 field lists.** The design spec itemises Step 1 field-by-field but only *names* steps 2–5. | (a) ship the inferred set · (b) wait for the remaining frames | **(b) if the frames exist**, else (a). The inferred set is in WS3 step 4 and is defensible, but building 5 step components against guessed fields is the largest rework risk in the batch. |
| **D5** | **Redesign the Congolese path to match the international one?** ← *explicitly flagged* | (a) keep the 5-step Congolese wizard verbatim, add only the chooser in front · (b) redesign both to the new visual language | **(a).** The customer supplied only the international design. Redesigning the Congolese path means inventing UI they have not approved, on the path that carries the existing traffic, with real regression risk — and it triples WS3. Ship (a), show it, let them ask for (b) as its own slice. |
| **D6** | **Promotion plumbing: which table grants entitlement?** Two systems exist — `premium_requests` (authenticated, company-scoped, RLS-hardened, flips `is_premium`) and `business_requests` (anonymous lead, service-role insert). The design's CTAs are anonymous-friendly, so they land in `business_requests` — meaning admins see promotion applications in `/admin/requests`, **not** `/admin/requests/premium`, and approving one grants nothing. | (a) anonymous lead only, admin converts manually · (b) also revive `premium-cta.tsx` for signed-in owners · (c) merge the two tables | **(a) for this batch, and say so out loud.** (c) is real work and out of scope. Without this being stated the customer will report "my applications are missing". Also decides whether `premium-cta.tsx` is deleted. |
| **D7** | **Do `legal@` and `privacy@tradeindrc.com` have mailboxes?** Hardcoded in translated legal prose at `en.json:2670, 2700, 2738` (×5 locales). | (a) confirm they exist · (b) fold all 15 into `support@` | Do not touch until answered. Routing a GDPR/Digital-Code request to a dead mailbox is worse than a mismatched domain. |
| **D8** | **Is the price pair still $3,000 / $3,600, and is $6,000 confirmed?** Both the 00023 CHECK and the new one hardcode these. A price change is a migration, not a config edit. | — | Confirm before 00039 is applied. Also confirm the Local tab keeps the $3,000 offer verbatim — the supplied PNG only shows the International tab. |

### Investigator disagreement I resolved

Two investigators proposed contradictory shapes for the classification column.

- **Proposal A** — `registration_type` as a `GENERATED ALWAYS … STORED` column derived from `country`. Unforgeable, cannot drift.
- **Proposal B** — `registration_profile`, a plain column written from the user's explicit chooser selection.

**I chose B, with A's security instinct bolted on** (a CHECK constraint plus `REVOKE UPDATE` from `authenticated`, so it cannot be forged after insert).

Reason: the customer design puts an explicit *"Choose your company profile"* card pair at the front of the wizard. The profile is a **user declaration that drives which form they fill in** — it is not a function of the country field. A DRC-registered subsidiary of an international group may legitimately declare international; a generated column would silently overrule them, and the two values would then disagree about which `superRefine` branch validated the submission. Proposal A also makes admin correction impossible except by editing the country, and it derives from an exact string match on `"Democratic Republic of the Congo"` that nothing in the DB enforces — one manual `"DR Congo"` correction reclassifies a company and changes its promotion price.

---

## Migrations

Three migrations, one per workstream, so each ships independently. **This is a live government production database** (per the 00023 header) — every statement idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`) per `supabase/migrations/CLAUDE.md`, and applied immediately on write per the project rule.

| # | File | Contents | Ships with |
|---|---|---|---|
| **00037** | `00037_profiles_lockdown.sql` | REVOKE `UPDATE (role, staff_role, account_type)` on `profiles` from `authenticated` + `anon`; GRANT back `(full_name, avatar_url)`; `handle_new_user()` learns a **whitelisted** `account_type` from signup metadata; partial index on `account_type`. | WS1 |
| **00038** | `00038_companies_registration_profile.sql` | `companies.registration_profile TEXT CHECK IN ('congolese','international')`; backfill from `country` (DRC → congolese, else international); `REVOKE UPDATE` on it from `authenticated`; index on `(status, registration_profile)` for the admin filter. **Do not touch `companies_public`** — this is admin triage metadata, not public profile data. | WS3 |
| **00039** | `00039_promotion_plans.sql` | Re-declare the `premium_requests` plan CHECK to admit `international_strategic`; re-declare `premium_requests_amount_matches_plan` to pin 3000/3600/**6000**; add `business_requests.promotion_plan` + `promotion_amount_usd` + `applicant_country` (all nullable), CHECK-pinned the same way and REVOKE'd from `authenticated`; index `business_requests(promotion_plan)`. | WS4 |

**`src/lib/supabase/types.ts` is hand-maintained — never run `supabase gen types`.** It would destroy the hand-authored unions at lines 1-107. Hand-edit per migration:

- 00038 → add `registration_profile` to `companies` Row/Insert/Update.
- 00039 → widen `PremiumPlan` (line 101) to include `international_strategic`, and add `promotion_plan` / `promotion_amount_usd` / `applicant_country` to `business_requests`. **While in there, add the missing `reference` field** (exists in the DB since 00030) so `premium-apply-actions.ts:86` can drop its `as unknown as` cast.
- Widening `PremiumPlan` also widens `companies.premium_plan` — check the `DashboardPremium` label tree or a strategic-tier company shows a wrong badge.

**No migration is needed for contact details.** A hardcoded config constant is correct for a value that changes once a year. If someone proposes a settings table for it, push back.

---

## Risks

1. **The `profiles` REVOKE is a live behaviour change on a production government DB.** Any code path still updating those columns with the anon/authenticated client starts failing with `permission denied for column`. `src/lib/admin/users-actions.ts:251-267` is the only writer found — verify it is on the service-role client *before* pushing, or admin user management breaks the moment the migration lands.

2. **Supabase Auth "Redirect URLs" is a hosted-dashboard setting, not a repo change.** Adding `emailRedirectTo` breaks every confirmation link unless `http://localhost:3000/{en,fr,es,tr,zh}/callback` and the production equivalents are whitelisted first. No migration can cover this.

3. **If "Confirm email" is ON, `signUp()` returns a user with no session.** The post-signup destination must be `verify-email`, never an auth-gated route — otherwise the user bounces straight back to login. Confirm the setting; it cannot be determined from the repo.

4. **Deleting `src/components/registration/*` is irreversible in the working tree.** Those 8 files may embed document-upload paths, sector handling and review logic the market wizard does not replicate. Diff before deleting, not after.

5. **The $6,000 tier is rejected by the DB until 00039 lands.** `00023_premium_hardening.sql:39-40` is a plain CHECK, so shipping the UI first produces a generic `write_failed` with no user-facing explanation. Verify no existing `premium_requests` row violates the new CHECK before applying.

6. **Documents are captured as filenames only.** `register-company-actions.ts` stores names; nothing reaches Storage, no `company_documents` rows are created, so `docsComplete` is never true for wizard registrations. A pre-existing gap that becomes indefensible once a $3,600 paid tier is attached to it. Out of scope here — flag it as the next slice.

7. **`verification_summary` is a single JSON blob** also written by `admin/companies/[id]/trust-profile-form.tsx:136`. If that form replaces rather than merges, shipping the intake panel will surface data that a subsequent admin edit silently destroys.

8. **Locale drift.** Four of the workstreams edit all 5 catalogs; WS3+WS4 add ~150 keys between them. Machine-translating legal/tax vocabulary ("Tax/VAT Identification Number", "Certificate of Incorporation") into FR — a primary locale for this portal — risks wrong legal terms. A malformed JSON edit breaks every page in that locale at request time, not build time.

9. **A live pricing contradiction during rollout.** Every entry point today says USD 3,000 / "Premium Local Partner" — navbar "Promote" (`navbar.tsx:58`), the footer, the marketplace join-today card, the home quick action. Do not silently remove the 3,000 price; it must stay visible on the Local tab.

10. **Renaming `next=` to `redirect=` touches 10+ call sites.** A missed one degrades silently to `/dashboard` rather than erroring — invisible to both the build and the type checker.

11. **No hero asset exists** for the redesigned promote page (`public/images/pricing/` holds only `hero-mining.jpg`). Source it before WS4 starts.

12. **Verification environment note:** headless screenshots of this app come back blank (client-hydrated shell), and never run `npm run build` while `next dev` is live — see the project memory note.

---

## Definition of done, per workstream

- **WS1** — in incognito: `/en/login` → Sign up → `/en/signup` renders the form → submit → verify-email shows the address → emailed link → `/en/callback` → destination. Repeat on `/fr`. `/en/register` redirects. `grep` finds no import of `src/components/registration/*`. As a normal authenticated user, `update profiles set role='admin'` fails with `permission denied for column role`.
- **WS2** — the sweep grep returns zero hits; email and phone are tappable on mobile; footer shows contact on every page.
- **WS3** — International → 7 steps advance with per-step validation; submit signed out routes to signup with a preserved draft; submit signed in inserts a row with `registration_profile='international'` and a populated `address`; the admin intake panel renders every captured field. Congolese path: zero regression across its 5 steps.
- **WS4** — three tabs render; a forged `business_requests` insert with a mismatched plan/amount is rejected by the CHECK; the admin queue shows which tier was requested and warns on a plan-vs-profile mismatch.
