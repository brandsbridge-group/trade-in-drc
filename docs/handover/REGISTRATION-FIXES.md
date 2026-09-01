# Company Registration — Diagnosis and Fix Plan

Date: 2026-08-27
Scope: `/register-company` wizard and the `/dashboard` screen it hands off to.
Status: diagnosis complete, nothing fixed yet. Every claim below is anchored to a file and line.

---

## 1. What is actually broken (plain language)

The client's five reports are real. They are caused by six separate defects, not one.

```
  Register page                                   Dashboard
  ┌──────────────────────────────┐
  │ Hero                         │
  ├──────────────────────────────┤
  │ "Congolese / International"  │ ← (1) the price cards are pulled UP
  │  ▒▒▒▒ covered by prices ▒▒▒▒ │      by 56px and sit ON TOP of this
  ├──────────────────────────────┤      question. They also swallow clicks.
  │ Price cards                  │
  ├──────────────────────────────┤
  │ Form steps 1..5 (or 1..7)    │ ← (3) one required field (phone country
  │                              │      code) is invisible and unchecked
  ├──────────────────────────────┤
  │ [ Submit for review ]        │ ← (2) if anything goes wrong the button
  └──────────────────────────────┘      goes grey FOREVER and says nothing
                │                       (4) if you were not logged in, you are
                └──────────────────────▶ sent to login and never brought back
                                        (5) dashboard still says "Register
                                            Your First Company"
```

1. **Prices cover the account-type question.** The three price cards carry a
   "float upwards" style that was written when they sat under the blue hero
   banner. Someone later inserted the "I am a Congolese / International company"
   question above them, and nobody removed the float. The cards now sit on top of
   that question, hiding roughly the bottom half of both cards and — worse —
   *stealing the clicks* aimed at them. `tier-cards.tsx:23`.
2. **"The plan disappears" is not a crash.** Choosing *International* deliberately
   removes the Congolese price cards; international pricing only reappears at step
   5 of 7. Nothing is lost, but nothing explains it either. `register-wizard.tsx:221`.
3. **Submit really can be dead.** Two independent faults: (a) if the network drops
   or the server throws, the code never re-enables the button — it stays grey until
   the page is reloaded, with no error message; (b) if a field is missing, the
   wizard silently jumps to an earlier step *without scrolling*, so from the user's
   chair the button "did nothing". `register-wizard.tsx:155-167, 286-294`.
4. **International applicants are blocked by an invisible field.** The phone
   country code is required by the server but is not on the wizard's own required
   list, and it is auto-filled for only 22 of ~154 selectable countries. Everyone
   else gets a blank prefix box and, at the end, "Some fields are invalid" with
   nothing highlighted. `register-company-actions.ts:47`, `types.ts:173-184`.
5. **Not logged in = data limbo.** An anonymous visitor can complete every step.
   Only the final click discovers there is no account; they are pushed to
   `/login?redirect=…` and the `redirect` parameter is *never read*, so they land
   on an empty dashboard. `user-auth-form.tsx:74`.
6. **The dashboard says "Register Your First Company" even when you have one.**
   That button text is hard-coded and shown regardless of how many companies the
   user owns. On top of that the company list is cached for 60 seconds and is not
   refreshed after registration, so a genuinely-registered company can be missing
   for a minute. `dashboard/page.tsx:164-171`; `register-wizard.tsx:169-180`.

The registration data model itself is sound: the company row is written with the
correct owner, and the dashboard reads it with the correct filter. Nothing is lost
in the database.

**Before any code change, one 10-minute check is mandatory** — see P0-0.

---

## 2. P0 — blocks a real user completing registration

### P0-0. Confirm whether the client's rows were ever written (do this first)

Not a code change. Everything below assumes the write succeeds; if it does not,
priorities change.

- Read Vercel runtime logs, filter `[registerCompany]` — this line
  (`register-company-actions.ts:249-252`) prints the Postgres error code for any
  DB rejection.
- Run against prod (service-role key from `.env`; never print or commit it):
  ```sql
  select id, name, status, owner_id, created_at
  from public.companies order by created_at desc limit 20;

  select column_name from information_schema.columns
  where table_name = 'companies'
    and column_name in ('registration_profile','country');
  ```
  The insert writes both of those columns (`register-company-actions.ts:180+`,
  added by migrations `00035` and `00038`). If either is missing in prod,
  **every** submission fails with the generic server error and that is the whole
  story. Apply only the missing migration — do **not** `supabase db push` the
  whole backlog blind (`00040_pin_declared_columns.sql:41-68` installs
  BEFORE-UPDATE triggers; `00037` revokes privileges).

Verify: the client's company appears in the query, or you have a Postgres error
code naming the real cause.

---

### P0-1. Price cards cover and steal clicks from the account-type chooser

**Client symptom:** "these boxes of prices are on top of options choices" (4 photos).

**Root cause.** `src/components/register/market/tier-cards.tsx:23`

```
<section className="relative z-10 mx-auto -mt-10 w-full max-w-[1500px] px-4 md:-mt-14 md:px-6">
```

`-mt-10 / md:-mt-14` pulls the section up 40px (56px ≥768px). The float was
written for the hero (docstring, `tier-cards.tsx:14-18`); the chooser was inserted
between hero and tiers later (`register-wizard.tsx:217` then `:221`). The chooser
section has `pt-8` and **no bottom padding** (`profile-chooser.tsx:29`), so the pull
lands on the cards themselves. The tier cards are opaque `bg-white`
(`tier-cards.tsx:35`) at `z-10` against unpositioned chooser buttons
(`profile-chooser.tsx:45`), so they both hide the text *and* absorb the clicks in
that band. Present at every width ≥768px, not only the client's laptop.

**Exact change.** `tier-cards.tsx:23` →

```
<section className="relative mx-auto w-full max-w-[1500px] px-4 pt-8 md:px-6">
```

Drop `-mt-10`, `md:-mt-14` and `z-10`; add `pt-8`. Single call site
(`register-wizard.tsx:221`), so nothing else is affected.

**House rule to stop the recurrence:** no element between `<RegisterHero />` and
`<BenefitsStrip />` may carry a negative margin or a `z-index`. Bands space
themselves with their own `py-*`.

**Verify.** `/en/register-company` and `/fr/register-company` at 1366×768 @90%,
plus 390 / 768 / 1440 / 1920: both chooser titles and body lines fully visible, and
clicking the *bottom edge* of each chooser card selects it.

---

### P0-2. Submit button greys out permanently on any thrown error

**Client symptom:** "I can't submit for review" / greyed-out button.

**Root cause.** `register-wizard.tsx:164-167`

```
setSubmitting(true);
const id = toast.loading(t("nav.submitting"));
const res = await registerCompany({ plan, data });
setSubmitting(false);          // ← only runs on the happy path
```

No `try/catch/finally`. Any rejection (network drop, redeploy invalidating the
server-action id, a throw inside `createAdminClient`) skips line 167 forever. The
button's only disabled condition is `disabled={submitting}` with
`disabled:opacity-60` (`register-wizard.tsx:286-294`), so it stays grey and inert
until a full page reload, with the loading toast still spinning.

**Exact change.**

```ts
setSubmitting(true);
const id = toast.loading(t("nav.submitting"));
let res: RegisterResult;
try {
  res = await registerCompany({ plan, data });
} catch (e) {
  console.error("[registerCompany] threw", e);
  toast.error(t("errors.server"), { id });   // reuse the loading toast id
  return;
} finally {
  setSubmitting(false);
}
// existing res.ok / auth / invalid branches unchanged
```

Also wrap the body of `registerCompany` (`register-company-actions.ts:165-253`) in
a `try/catch` returning `{ ok: false, error: "server" }`, so the action always
resolves to a typed result.

**Verify.** In dev, temporarily `throw new Error("boom")` at the top of
`registerCompany`: the button must return to active, one red toast must appear, and
a second click must be possible. Then remove the throw.

---

### P0-3. Submit silently jumps to an earlier step without scrolling

**Client symptom:** same report — "the button does nothing".

**Root cause.** `register-wizard.tsx:155-163` re-validates every step and on the
first failure does `setStepIndex(i); setErrors(missing); toast.error(...); return;`
— with **no** `window.scrollTo`, unlike `goNext` which does scroll
(`register-wizard.tsx:144-145`). The user stays parked at the bottom of a long page
while the wizard quietly changes to a step rendered far above.

**Exact change.** Insert immediately after `setStepIndex(i)` in the submit loop:

```ts
window.scrollTo({ top: 0, behavior: "smooth" });
```

and render an inline error banner at the top of the step (not only the corner
toast) listing the missing field labels.

**Verify.** Leave one required field empty, scroll to the bottom, press Submit:
the page must scroll to the top of the offending step with the field outlined.

---

### P0-4. International path: required phone country code is invisible and unchecked

**Client symptom:** "I can't submit for review" on the international path;
"Some fields are invalid" with nothing highlighted.

**Root cause.** Three facts combine:

| # | Fact | Location |
|---|---|---|
| 1 | Switching to International blanks `country` **and** `dialCode` | `register-wizard.tsx:124-128` |
| 2 | Only ~22 of ~154 selectable countries auto-fill a dial code | `step-intl-company-info.tsx:25-28`; `src/config/geo.ts:12, 321` |
| 3 | `requiredForStep("company_info")` omits `dialCode`, but the server requires it | `types.ts:173-184` vs `register-company-actions.ts:47` |

So Next passes, the pre-submit loop passes, and the server rejects with the generic
`invalid`. The prefix `<select>` renders with `value=""` matching no option
(`field-kit.tsx:147-156`), i.e. a blank box the user has no reason to notice.

**Exact change — all three parts must ship together.**

1. `types.ts:173-184` — add `"dialCode"` to the `company_info` required list.
2. `step-intl-company-info.tsx:116` — `invalid={has("phone") || has("dialCode")}`
   (without this, part 1 just moves the dead end from step 7 to step 1).
3. `field-kit.tsx:154` — add a disabled placeholder `<option value="">—</option>`
   so an empty prefix reads as empty.

Do **not** stop blanking `dialCode` on the international path: a stale `+243`
would be written into `contact_phone` (`register-company-actions.ts:192`) for every
foreign company. Widening `COUNTRY_DIAL_CODE` toward full ISO coverage is a
nice-to-have on top, not a substitute.

**Verify.** International path, pick Switzerland (unmapped): Next must be blocked
on step 1 with the prefix box outlined; pick a prefix, then complete and submit
successfully.

---

### P0-5. Server rejections tell the user nothing and highlight nothing

**Client symptom:** the same "Some fields are invalid" dead end, for any future
mismatch between client and server validation.

**Root cause.** `register-company-actions.ts:165-166` throws away every Zod issue
(`return { ok:false, error:"invalid" }`), `RegisterResult` has no field channel
(`types.ts:108-112`), and the wizard's invalid branch
(`register-wizard.tsx:186-188`) fires a bare toast without `setErrors` or
`setStepIndex`.

**Exact change.**

```ts
// register-company-actions.ts
if (!parsed.success) {
  console.error("[registerCompany] invalid",
    parsed.error.issues.map((i) => i.path.join(".")));
  return {
    ok: false,
    error: "invalid",
    fields: parsed.error.issues.map((i) => i.path[1]).filter(Boolean) as string[],
  };
}
```

Add `fields?: string[]` to `RegisterResult` (`types.ts:108-112`). In the wizard's
invalid branch: `setErrors(new Set(res.fields))` and jump to the first step whose
`requiredForStep` list contains one of them; if the mapping is empty, stay on
Review with the generic toast.

Return `issue.path` only — never `issue.message` (raw English Zod text would leak
into the FR UI). Also return a stable error code (not `error.message`) from the DB
branch at `:249-252` so support tickets carry something actionable.

**Verify.** Force a server-only rejection (e.g. temporarily tighten `website` in
the Zod schema), submit, and confirm the wizard lands on the right step with the
field outlined.

---

### P0-6. Anonymous applicants are sent to login and never brought back

**Client symptom:** contributes to both "can't submit" and "dashboard still says
register your first company".

**Root cause.** Nothing gates the wizard on auth. `registerCompany` returns
`{error:"auth"}` (`register-company-actions.ts:174`); the wizard pushes
`LOGIN_REDIRECT = "/login?redirect=/register-company"` (`constants.ts:161`,
`register-wizard.tsx:181-184`), but no code reads `?redirect=` — `user-auth-form.tsx:74`
hard-navigates to `/${locale}/dashboard`. The draft does survive in sessionStorage
(`register-wizard.tsx:103-113`), but the user has no reason to know that.

**Exact change.**

1. `src/components/auth/user-auth-form.tsx:74` — read `?redirect=` from
   `useSearchParams()` and honour it, reusing the same-origin guard already written
   in `src/app/[locale]/(auth)/callback/route.ts` (copy it, do not rewrite it).
2. Gate up front: on `/register-company`, if `useAuth()` has no user, show a
   sign-in prompt above the wizard ("You'll need an account to submit — sign in now
   and your progress is kept") rather than discovering it at the last click.

**Verify.** Logged out, fill the wizard, press Submit → login → you land back on
`/register-company` with the draft intact, and submit succeeds.

---

## 3. P1 — visible breakage that does not block registration

### P1-1. Dashboard says "Register Your First Company" to an owner who has companies

`dashboard/page.tsx:164-171` renders `{t("registerFirst")}` in the page header
unconditionally — no `companies?.length` check. The same key is legitimately reused
for the real empty state at `:295`, which is why the client sees it twice.
String: `en.json:271` / `fr.json:271`.

Fix: `companies?.length ? t("registerAnother") : t("registerFirst")`; add
`registerAnother` to **both** `en.json` and `fr.json` in the same commit. Guard on
`isLoading` so the label does not flip after hydration.

### P1-2. A freshly registered company can be missing from the dashboard for 60s

`register-wizard.tsx:169-180` never invalidates the React Query cache (the file does
not import `@tanstack/react-query` at all), while `query-provider.tsx:12-13` sets
`staleTime: 60_000` and the QueryClient survives client navigation
(`layout.tsx:102`). The success CTA is a client-side `<Link href="/dashboard/companies">`
(`register-wizard.tsx:201-206`), so a cached empty list paints first.

Fix: in the success branch, `queryClient.invalidateQueries({ queryKey: ["companies"] })`
before `setDone(true)`; and set `refetchOnMount: "always"` on the query in
`src/hooks/use-companies.ts:7-20`. The dashboard's own resubmit handler already does
exactly this (`dashboard/page.tsx:103`) — follow that pattern.

### P1-3. "View Profile" on a pending company 404s

`companies/[id]/page.tsx:52-60` reads the view `companies_public`, which is defined
`WHERE c.status = 'verified'` (`00036_companies_public_country.sql:31`). Registration
always writes `status: pending` (`register-company-actions.ts:193`), so the owner's
own company 404s. The dashboard links there unconditionally
(`dashboard/page.tsx:257-262`).

Fix on the **dashboard** side: render View Profile only when
`company.status === "verified"`, otherwise a disabled button with "visible once
verified". Do not drop the status predicate from the view — it is granted to `anon`
and would leak unverified companies everywhere.

### P1-4. Choosing International makes the plan panel vanish with no replacement

Intentional (`register-wizard.tsx:221`, comment at `:219-220`) but unexplained; the
international plan only appears at step 5 of 7 (`:250-252`).

Interim fix (cheap, keeps the P2 redesign open): render a one-line notice in that
slot from the `RegisterCompany.intl` namespace — "Your international plan is chosen
at step 5" — so the vertical rhythm holds and the click reads as a mode change, not
a crash.

### P1-5. A Congolese-only tier can follow the user into the international path

`selectProfile` (`register-wizard.tsx:116-129`) resets step, errors, country and
dial code but never the plan (`:64`). Pick *Verified*, then switch to International:
`plan === "verified"`, which the international path never offers. The review screen
mislabels it "Standard Listing" (`step-review.tsx:52-56`) while the server stores
`chosen_tier: "verified"` (`register-company-actions.ts:197`) and writes
`Chosen tier: verified` into the text an admin reads (`:132`).

Fix: add `setPlan("free")` inside `selectProfile`. Optionally coerce server-side
after `:167`: international + `verified` → `free`.

### P1-6. Sidebar "Choose Premium" skips four unvalidated steps and names the wrong plan

`register-wizard.tsx:309-318` does `setStepIndex(steps.indexOf("profile_plan"))`
(index 4 of 7) bypassing `goNext`'s validation (`:136-146`), and `selectPlan`
(`:131-134`) always toasts `tiers.${p}.name` → an international applicant is told
they picked "Premium Local Partner" instead of "Premium International Profile".

Fix: keep `selectPlan("premium")`, delete the `setStepIndex` + `scrollTo` lines, and
make the toast namespace-aware:
`international ? t("intl.plan." + p + ".name") : t("tiers." + p + ".name")`. Add a
persistent selected state on the sidebar card (mirror
`step-intl-profile-plan.tsx:47-56`) so a $3,600 choice is not confirmed by a toast alone.

### P1-7. Company rows show a blank sector line

`use-companies.ts:13` selects `"*, verification_reviews(...)"` with no `sectors`
embed; the table has `sector_id` only (`00001_initial_schema.sql:152`). The dashboard
declares a phantom `sector: string` (`dashboard/page.tsx:39`), casts with
`as unknown as Company[]` (`:214,216`) and renders `undefined` (`:241`).

Fix: extend the select to `"*, sectors(name_en, name_fr), verification_reviews(...)"`
and render by locale (`useLocale()` is already in scope at `dashboard/page.tsx:46`).
Same phantom field exists in `dashboard/companies/page.tsx:20-25`.

---

## 4. P2 — UX and responsive improvements

### P2-1. Split the page into a Profile Gate, then the wizard

One decision per screen. New `phase: "profile" | "form"` state in
`register-wizard.tsx`, persisted in the sessionStorage draft alongside `stepIndex`
(`:103-113`) with `DRAFT_KEY` bumped (`constants.ts:158`). Phase `profile` renders a
new `profile-gate.tsx` — heading, two cards, one Continue button, **no pricing**, plus
a reassurance line ("Listing your company is free. You can add a paid plan later.").
Phase `form` renders `Stepper` + form card with a `Congolese company · Change` ghost
button that returns to the gate. Preselect `congolese` (`types.ts:59`) so Continue is
always live. New i18n keys in both `en.json` and `fr.json`:
`profileChooser.subheading | continue | freeNote | change`.

### P2-2. One plan step, second-to-last, on both paths

Extract the tier card body into `plan-picker.tsx` with props
`{ plans, selected, onSelect, namespace }` — Congolese reads `RegisterCompany.tiers.*`,
international reads `RegisterCompany.intl.plan.*`, so copy never crosses paths.
Replace `profile_plan` with `plan` at `constants.ts:58` and insert `plan` before
`review` at `constants.ts:47` (Congolese 5 → 6 steps). `requiredForStep("plan")`
returns an empty Set, so Free (already the default, `register-wizard.tsx:64`) is a
single Next away. Suppress the international sidebar on the plan step
(`register-wizard.tsx:228, 309`) so the offer is not duplicated in one viewport. Show
`Plan: <name>` with a Change link on Review. Delete `tier-cards.tsx` and
`step-intl-profile-plan.tsx`. **Bump `DRAFT_KEY` in the same commit** — `:88-97`
restores `stepIndex` blindly and reordering would land returning users on the wrong
step. Instrument paid-plan conversion before and after.

### P2-3. Chooser card responsiveness, 390 → 1920

Current card is `flex items-center gap-4 p-4` (`profile-chooser.tsx:45`) with an
absolutely positioned badge at `right-4 top-4` (`:74-77`) and no reserved lane, so at
narrow widths the badge sits over the title. Replace with:

```
group relative flex w-full min-h-[112px] items-start gap-4 rounded-xl border-2
bg-white p-5 pr-12 text-left transition-colors duration-150 ease-out
```

icon `size-12 flex-none sm:size-14`, text wrapper `min-w-0 flex-1`, title never
truncated. Grid `mt-6 grid gap-4 sm:grid-cols-2`. The three load-bearing classes:
`pr-12` (badge lane), `min-w-0 flex-1` (no horizontal scroll), `items-start`
(icon stays with the title when FR wraps to 3 lines).

### P2-4. International step 1 is cramped at desktop widths

`step-intl-company-info.tsx:33` steps to `xl:grid-cols-4` on the **viewport**, but the
form only gets 2.6/3.6 of the container on the international path
(`register-wizard.tsx:228-229`) → ~190px cells at 1280px, ~230px at the client's
1518 CSS px, and FR labels wrap to 2-3 lines (`field-kit.tsx:31`, no truncation).

Fix: add `@container` to the form card (`register-wizard.tsx:232`) and use container
queries (`grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4`). Cheap alternative: drop
`xl:grid-cols-4`, keep `sm:grid-cols-2`. Re-derive the head-office `sm:col-span-2`
(`:118`) for whatever track count is chosen — note the "empty columns beside Head
Office" report was **refuted**: 10 single items + one 2-span = exactly three full
4-track rows.

### P2-5. Sidebar minimum width

`register-wizard.tsx:229` → `lg:grid-cols-[minmax(0,2.6fr)_minmax(280px,1fr)]`, so the
premium card never drops below ~226px inner width at 1024px. Do **not** move the
split to `xl:` — that pushes the premium offer below the fold for the whole
1024-1279px band.

### P2-6. Motion for the gate ↔ wizard swap (per `docs/MOTION.md`)

`<AnimatePresence mode="wait">` keyed on `phase`; enter
`{opacity:0, translateY:8}` → `{opacity:1, translateY:0}` with
`{type:"spring", duration:0.3, bounce:0}`; exit
`{opacity:0, translateY:4, filter:"blur(2px)", duration:0.2}`. Hero stays outside the
wrapper. No new motion on card selection — keep `transition-colors duration-150 ease-out`.
`useReducedMotion()` → `initial={false}` and a plain 0.15s opacity fade; scroll with
`behavior: reduce ? "auto" : "smooth"`.

### P2-7. Stepper and confirmation

`stepper.tsx:29-63` renders non-interactive `<li>`s with no "Step 3 of 7" counter and
no back-navigation to completed steps — add both. Send a confirmation email on insert.
Land every successful path on `/dashboard/companies` (the login path currently lands on
`/dashboard`, the wizard CTA on `/dashboard/companies` — two endings to one journey).

### P2-8. Documents step honesty

`step-documents.tsx:41` captures only `files[0].name`; the action stores file **names**
under a TODO (`register-company-actions.ts:234-242`). An applicant is blocked by a
required upload that is never uploaded. Immediate cheap fix: drop the unconditional
`required` prop on the NIF dropzone (`step-documents.tsx:116-120`) — `requiredForStep`
already exempts it for international (`types.ts:170`), so today's red asterisk is a lie.
Real fix (wire Supabase Storage) is out of scope here.

### P2-9. Company slug is never generated

`00017_page_content.sql:199-206` deliberately delegates slug generation to the app; the
insert has no `slug` key (`register-company-actions.ts:177-247`); no trigger exists.
`/trust/[companySlug]` can therefore never resolve for a new company. Fix with a
`BEFORE INSERT` trigger reusing the slugify + numeric-suffix logic already written at
`00017:212-247` — doing it in app code without a collision loop would turn a cosmetic
gap into a hard registration failure on duplicate names.

---

## 5. Test checklist

### Manual, at 1366×768 @90% zoom (≈1518 CSS px), Chrome on Windows, EN **and** FR

| # | Steps | Pass condition | Covers |
|---|---|---|---|
| 1 | Load `/en/register-company`, screenshot the top of the page | Both chooser cards fully visible; no price card overlaps them | P0-1 |
| 2 | Click the **bottom 20px** of each chooser card | The card selects (border turns primary) | P0-1 |
| 3 | Repeat 1-2 at 390 / 768 / 1024 / 1440 / 1920, and in FR | Same, and no horizontal page scroll at any width | P0-1, P2-3 |
| 4 | Congolese path, complete all 5 steps, Submit | Success screen; company appears in `/dashboard/companies` immediately | P0-2, P1-2 |
| 5 | Congolese path, blank one step-2 field, scroll to bottom, Submit | Page scrolls to that step, field outlined, toast shown | P0-3 |
| 6 | Dev only: `throw` inside `registerCompany`, Submit | Button returns to active, red toast, second click possible | P0-2 |
| 7 | International path, country = Switzerland, do not touch the prefix, press Next | Blocked on step 1, prefix box outlined | P0-4 |
| 8 | International path, complete all 7, Submit | Success, no "Some fields are invalid" | P0-4, P0-5 |
| 9 | Logged out, complete the wizard, Submit | Login → returned to `/register-company` with the draft intact → submit succeeds | P0-6 |
| 10 | With one company owned, open `/dashboard` | Header reads "Register Another Company"; empty state absent | P1-1 |
| 11 | Same, click View Profile on a pending company | Button disabled with "visible once verified" — no 404 | P1-3 |
| 12 | Pick "Verified", switch to International, reach the plan step | Free is selected; review shows the international plan name | P1-5 |
| 13 | International, click sidebar "Choose Premium" from step 1 | Stays on step 1; toast says "Premium International Profile" | P1-6 |
| 14 | Any company row in `/dashboard` | Sector name rendered, not blank | P1-7 |

Screenshots of rows 1, 2 and 10 in both locales go back to the client.

### Vitest (project already runs 13 test files, `vitest.config.ts`, jsdom + globals)

Worth writing — pure logic, high regression value:

1. `src/components/register/market/types.test.ts` — `requiredForStep("company_info", {profile:"international"})` **includes** `dialCode`; every key returned by `requiredForStep` for both profiles exists in the Zod `payloadSchema`. This is the guard that makes P0-4 and P0-5 non-recurring. **Highest value test in this list.**
2. `register-company-actions.test.ts` — `payloadSchema.safeParse` on a valid Congolese payload and a valid international payload succeeds; an international payload with `dialCode: ""` fails with `issues[0].path` containing `dialCode`.
3. `register-wizard` reducer/helper test — `selectProfile("international")` clears `country`, `dialCode` **and** resets `plan` to `"free"` (P1-5). Extract the transition into a pure function first so it is testable without rendering.
4. Component test (jsdom, RTL — the pattern already exists in `src/components/design/__tests__/filter-sidebar.test.tsx`): `<ProfileChooser>` — clicking a card fires `onSelect`. This does **not** catch the overlap (jsdom has no layout), so pair it with the manual screenshot; do not claim P0-1 is covered by a unit test.
5. Extend `src/components/register/market/registration-profile.test.ts` with the international-plan coercion once P1-5's server-side coercion lands.

Not worth a Vitest test: the overlap (no layout engine), the grey-button behaviour
(needs a rejected server action — cover it with the manual step 6), the React Query
invalidation (integration-shaped, low payoff).

---

## 6. Not doing now

- **The full wizard reorder** (auth first → identity → activity → contacts →
  documents → review → plan) described in the design proposal. It rewrites
  `register-wizard.tsx`, `constants.ts`, `types.ts` and `stepper.tsx` together. Ship
  P0 + P1 first, then P2-1/P2-2 as one separate change with conversion measured.
- **Server-side draft persistence** (a drafts table + RLS). SessionStorage already
  survives the login hop; a new table is a migration plus a data-leak surface.
- **Wiring document uploads to Supabase Storage.** Real work, its own slice. Until
  then only the false `required` marker is corrected (P2-8).
- **Pushing the pending migration backlog.** Only the specific missing column, if
  P0-0 finds one. `00040` installs BEFORE-UPDATE triggers and `00037` revokes
  privileges — a blind `db push` against a live government DB is the largest risk in
  this document.
- **Editing the `companies_public` view** to let owners see pending companies. It is
  granted to `anon`; dropping the status predicate would leak unverified companies
  everywhere. If owner previews are wanted later, it needs a separate owner-scoped
  view.
- **Widening `COUNTRY_DIAL_CODE` to full ISO coverage** (`src/config/geo.ts:321`).
  Nice-to-have; P0-4 closes the hole without it.
- **Restoring the "cards floating over the hero seam" look.** It is unreachable on
  this page now that the chooser sits between hero and tiers. It belongs on the
  pricing/marketing page, not on a form.

---

## 7. Verification record — P0-0

The working notes from the original P0-0 check were not preserved. This section
is the factual record of what was checked and found, written after the fact from
the post-ship audit, since the repo otherwise holds no evidence P0-0 ran at all.

- **Columns checked on `public.companies`:** `registration_profile`, `country`,
  `premium_plan`, `status`, `owner_id` — all five exist.
- **Row count at time of check:** 77 companies total. Newest row: created
  2026-07-28, name `__REVOKE TEST`.
- **The client's 2026-07-29 registration attempts wrote no rows.** No company
  matching the client's submission timing or details exists in the table.
- **Conclusion:** no migration was applied as part of this check (none was
  missing). The failure the client reported was client-side/validation, not a
  missing-column or missing-migration failure. P0-1 through P0-6 proceeded on
  that basis, as planned.

---

## 8. Verification record — migration 00042 (slug trigger)

Verified first on a scratch PostgreSQL 18 database, then APPLIED TO PRODUCTION on
2026-08-27 (project gwqjwxovcqfrvfrebzqi). Both records are below.

**Hostile precondition reproduced deliberately:** `unaccent` was pre-installed in
schema `public` (not `extensions`) before applying. That is the case where
`CREATE EXTENSION IF NOT EXISTS ... WITH SCHEMA extensions` silently no-ops and the
fully-qualified `extensions.unaccent(...)` call would then throw on every INSERT.

- Migration applied cleanly with `ON_ERROR_STOP=1`. No errors.
- After apply, `unaccent` had been relocated to schema `extensions`. The schema-drift
  handling works.

**Backfill and trigger output (verified values):**

| input name | resulting slug |
|---|---|
| `Société Générale du Congo` | `societe-generale-du-congo` |
| `Ørsted Ltd` | `orsted-ltd` |
| `Weiß GmbH` | `weiss-gmbh` |
| `Acme`, `Acme` | `acme`, `acme-2` |
| `Acme 2` | `acme-2-2` (did not collide with `acme-2`) |
| `  Ça  Marche!!  ` | `ca-marche` |
| `!!!` | `company-<uuid>` fallback |

**Concurrency:** 12 simultaneous inserts of an identical company name produced
0 failures and 12 distinct sequential slugs (`kinshasa-traders` … `-12`). No unique
violations. The transaction-scoped advisory lock holds under real contention.

**Final integrity:** 24 rows, 24 distinct slugs, 0 nulls.

**Note on TS/SQL divergence:** `Ørsted Ltd` → `orsted-ltd` here, while the TypeScript
`slugify()` in `src/lib/content/company-slug.ts` yields `rsted-ltd`. This confirms the
divergence documented in that file is real and that the SQL is the authoritative one.


## 9. Production apply record — migration 00042

Applied 2026-08-27 to project `gwqjwxovcqfrvfrebzqi` with `supabase db push --linked`.

**Safety check performed first.** `supabase migration list --linked` showed 00001
through 00041 already applied remotely and only 00042 pending, so the push applied
exactly one migration. The plan's earlier warning against a blind `db push` was
written when the remote state was unknown; there was no backlog to drag along.

**State before:** 77 companies, 45 of them with a NULL slug.

**Result:** applied clean, exit 0, one NOTICE about a non-existent trigger being
skipped on the idempotent DROP. After apply: 77 companies, 77 distinct slugs,
0 nulls, 0 duplicates.

Sample of backfilled values, confirming the transliteration path works against real
production data:

| company | slug |
|---|---|
| `Équateur Palm Industries` | `equateur-palm-industries` |
| `Kasai Diamonds & Stones` | `kasai-diamonds-stones` |
| `DRC Inspection & Certification` | `drc-inspection-certification` |
| `Katanga Copper Trading` | `katanga-copper-trading-2` (suffixed, slug already taken) |

P2-9 is now fully delivered rather than pending a migration.

---

## 10. P2-8 document uploads + migration 00043

**Shipped 2026-08-27.** The Documents step now uploads to the private
`company-documents` bucket. The company row is created first, then the browser
client uploads under an owner-scoped key, so RLS is satisfied and the service-role
client never reaches the browser. An upload failure toasts and does not undo a
registration, so a company can exist with documents missing; the admin queue already
renders those as missing, which is the honest state.

**Compliance defect caught in review, before merge.** The optional "additional
documents" dropzone was mapped to `proof_of_address`, one of the three types in
`EXPECTED_DOC_TYPES` that the admin verification queue scores. Any uploaded file
would therefore have shown a reviewer "Proof of address: uploaded" on a government
portal without an address ever being proved. It now maps to a type carrying no
regulatory signal, and a test asserts that mapping against `EXPECTED_DOC_TYPES`
directly, so remapping it back to a scored type fails the suite.

Known consequence, correct: `proof_of_address` now reads as missing for every
applicant coming through this wizard, because nothing ever collected it.

**Follow-up worth doing:** add a dedicated `additional_document` enum value. The
files currently borrow the `photo` label. It is not misleading in practice, since
the admin viewer shows the filename beside the type badge and the file opens, but
the label is still wrong.

**Migration 00043 applied to production 2026-08-27.** Sets `file_size_limit` to
5242880 (5 MB) and `allowed_mime_types` to `application/pdf, image/jpeg, image/png`
on `company-documents`, which is the server-side half of the upload limits. Verified
before applying that the bucket was empty, had no limits set, and that only the new
registration code writes to it, so no existing upload path could break. Verified
after applying by reading the bucket config back.

---

## 11. Follow-up closed — dedicated `additional_document` type

**Shipped and applied to production 2026-08-27** (migration 00044).

Section 10 left these files borrowing the `photo` label. They now have their own
type. `supabase/migrations/00044_additional_document_type.sql` widens the CHECK on
`public.company_documents.type`, following the discover-drop-readd pattern from
00011 §5 so it is idempotent and safe on a table with rows. Widening an allowed set
never invalidates existing data.

`EXPECTED_DOC_TYPES` is unchanged at the three legal documents, and a test asserts
the new type against that constant directly, so the additional-documents slot can
never drift back into a scored position.

**Verified against production after applying**, by inserting and immediately
deleting a probe row:

| probe value | result |
|---|---|
| `additional_document` | accepted |
| `__not_a_real_type__` | rejected by the CHECK constraint |

So the constraint accepts the new value and still rejects anything outside the set.
No probe rows were left behind.

Note for future schema changes: `src/lib/supabase/types.ts` is hand-maintained and
had to be edited by hand to add the union member, per the root CLAUDE.md. Never run
`supabase gen types` — it drops the hand-authored aliases at the top of that file.

---

## 12. Open item — registration confirmation email (NOT built)

P2-7 (§4) says "Send a confirmation email on insert." That part was **not
implemented**, and the rest of P2-7 shipped without it. Recording it here so the
line in §4 is not mistaken for delivered work.

**The client never asked for this.** It is not among the five defects they reported.
It comes from the P2-7 spec item, which derives from `docs/DASHBOARD.pdf`. Before
building it, confirm anyone actually wants it.

**Why it was not built:** this codebase has no transactional email provider. Account
email (signup confirmation, password reset) is sent by Supabase Auth, which works
today. There is no separate mail integration, and no `emails/` or template layer.

**If it is wanted, use Supabase's custom SMTP, not a SaaS provider.** Supabase Auth
accepts your own SMTP server under Project Settings → Auth → SMTP. That keeps the
stack open-source and self-hostable, which is a standing requirement for this
project, and adds no dependency, no vendor account and no extra secret. An earlier
draft of this section suggested Resend/SendGrid/Postmark — that was wrong on two
counts: those are proprietary SaaS, which conflicts with the self-hostable
requirement, and none of them are needed when Supabase already sends mail.

Note: `.env.example` still lists `RESEND_API_KEY` and `SENDGRID_API_KEY` as
commented-out placeholders. They are dead leftovers from an abandoned Firebase-era
stack, not a decision anyone made.

**Still blocked on a domain either way.** Any SMTP sender needs a verified sending
domain, and no production domain is registered yet (see §8 item 10 — the code assumes
tradeindrc.com, which nobody has bought). Deferred by the client 2026-08-27.

**Order of work when it becomes real:**
1. Register the production domain and point it at the app.
2. Configure SMTP in the Supabase dashboard, with SPF/DKIM on that domain.
3. Only then write code: a send in the registration success path of
   `register-company-actions.ts`, a bilingual template per locale, and a failure path
   that never blocks a registration — the same rule the document upload follows (§10).
