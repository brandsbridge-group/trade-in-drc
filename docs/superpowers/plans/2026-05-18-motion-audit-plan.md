# TradeInDRC Motion Audit & Implementation Plan

**Date:** 2026-05-18
**Weighting:** Emil primary · Jakub secondary · Jhey selective

---

## Section 1 — Audit Report

```
## Summary
- Critical:     4
- Important:    5
- Opportunities: 3
- Reduced-motion support: NO (P0 — MISSING from globals.css and all framer-motion components)
```

### Emil Kowalski (Primary)

**1. ExplorerTabs grid swap — no `<AnimatePresence>`** (Critical)
- `src/app/[locale]/companies/page.tsx` uses shadcn `<Tabs>` with conditional tab content. No `AnimatePresence` wrapping content panels. Instant swap violates Emil's "tab switch must have 150 ms fade-slide."

**2. Auth form mode toggle — instant swap** (Critical)
- `src/components/auth/user-auth-form.tsx` — mode state switches between login/signup/reset views with a plain conditional `{mode === "login" && <LoginForm />}`. No `AnimatePresence`, no motion.div. Abrupt.

**3. `latest-offers.tsx` — forbidden bounce on workhorse UI** (Critical)
- `src/components/layout/latest-offers.tsx:72–74` uses `stiffness: 100, damping: 15` spring on card stagger — this produces visible overshoot (underdamped spring ≈ bounce). Also `whileHover` at line 113 uses `stiffness: 400, damping: 25` (also springy/bouncy). Workhorse cards must not bounce — Emil rule.
- Duration `0.6` on `titleVariants` (line 474) violates ≤300 ms mount cap.
- `delay: index * 0.1` stagger for 8+ cards = last card delayed 0.8 s — exceeds ≤300 ms mount rule.

**4. `command-palette.tsx:82` — `bounce: 0.3` on utility modal** (Critical)
- `src/components/ui/command-palette.tsx:82` uses `{ type: "spring", duration: 0.4, bounce: 0.3 }`. Command palette is workhorse UI (Cmd+K search). Bounce is forbidden here.

**5. Hover targets without `transition` class** (Important)
- `src/components/layout/latest-offers.tsx` hover links (e.g., button at line 1418): `hover:bg-[#003d91]` with no `transition` class — color snap on hover.
- `src/components/layout/cookie-consent.tsx` terms/privacy links: `hover:text-primary` with no `transition`.

**6. Dashboard form conditional fields** (Important)
- `src/app/[locale]/dashboard/` product/opportunity forms — conditional sections revealed by `{x && <Field />}` with no `AnimatePresence`. Not yet seen in the current build (forms not yet built per DESIGN.md §3.13), but the pattern must be enforced when built.

### Jakub Krehel (Secondary)

**7. Home page sections lack mount recipe** (Important)
- `src/app/[locale]/page.tsx` — all 6 sections (`<HeroSection>`, `<BrandCarouselSection>`, `<FeaturedOpportunityStrip>`, `<ExplorerSection>`, `<FaqSection>`, `<NewsletterSection>`) render as plain RSC with zero mount animation. Marketing surfaces must use the Jakub recipe: `initial={{ opacity: 0, translateY: 8, filter: "blur(4px)" }}`.

**8. `<AlertRibbon>` dismiss — instant removal** (Important)
- `src/components/home/` — AlertRibbon (hero top-bar) uses `{visible && <AlertRibbon />}` with no `AnimatePresence`. Dismiss snaps the layout. Needs `motion.div layout` + fade + height collapse.

**9. `cookie-consent.tsx` — misapplied spring recipe** (Important)
- `src/components/layout/cookie-consent.tsx:41`: uses `stiffness: 300, damping: 30` (raw spring config) instead of the canonical Jakub recipe `{ type: "spring", duration: 0.45, bounce: 0 }`. Inconsistent, also translates only `y: 100%` — no opacity/blur envelope. shadcn `Dialog` components (line from `dialog.tsx`) do have built-in `animate-in/out` via Radix — confirmed OK, no action needed there.

### Jhey Tompkins (Selective)

**10. `OnboardingCard` step completion — no tick celebration** (Opportunity)
- `src/components/dashboard/onboarding-card.tsx` — `CheckCircle2` icon renders statically when `s.done` transitions from false → true. No pop/scale delighter on completion.

**11. `BrandLogoCarousel` logo hover — transition missing duration spec** (Opportunity)
- `src/components/design/brand-logo-carousel.tsx` — logo tiles use `grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition`. `transition` shorthand is correct (150 ms) but `scroll-snap-type: x mandatory` is set via `snap-x snap-mandatory`. Scroll feel is acceptable; logos need the Jhey `hover:scale-[1.02]` micro-scale to match the recipe.

**12. FAQ accordion — no smooth height** (Opportunity)
- `src/app/[locale]/faq/page.tsx:99` uses shadcn `<Accordion>` from Radix. Radix Accordion does animate height via `data-[state=open]:animate-in` — this is acceptable but only if the shadcn `accordion.tsx` wrapper retains the CSS. Verify `src/components/ui/accordion.tsx` has `overflow: hidden` + `data-[state=closed]:animate-out` on `AccordionContent`. If missing, add `interpolate-size: allow-keywords` CSS.

---

## Section 2 — Implementation Plan

### Task 1 — Global `prefers-reduced-motion` rule (P0)
**File:** `src/app/globals.css`
**Recipe:** Emil accessibility §4.1
**Change:**
```css
/* Add inside @layer base { ... } */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
**Why:** No reduced-motion guard exists anywhere in the codebase. This single rule covers all Tailwind transitions and CSS animations. Framer-motion components need their own `useReducedMotion()` guard (see Task 2).

---

### Task 2 — Command palette: fix bounce on workhorse modal (P0)
**File:** `src/components/ui/command-palette.tsx:82`
**Recipe:** Emil — no bounce on utility surfaces
**Change:**
```tsx
// before
transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
// after
transition={{ duration: 0.15, ease: "easeOut" }}
```
**Why:** Command palette is pure workhorse UI. `bounce: 0.3` produces visible overshoot. Emil forbids bounce on non-delighter surfaces.

---

### Task 3 — Auth form mode toggle: `<AnimatePresence>` swap (P0)
**File:** `src/components/auth/user-auth-form.tsx`
**Recipe:** Emil tab swap §2.4
**Change:**
```tsx
// before
{mode === "login" && <LoginFields />}
{mode === "register" && <RegisterFields />}
{mode === "reset" && <ResetFields />}

// after
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={mode}
    initial={{ opacity: 0, translateY: 4 }}
    animate={{ opacity: 1, translateY: 0 }}
    exit={{ opacity: 0, translateY: -4 }}
    transition={{ duration: 0.15 }}
  >
    {mode === "login" && <LoginFields />}
    {mode === "register" && <RegisterFields />}
    {mode === "reset" && <ResetFields />}
  </motion.div>
</AnimatePresence>
```
**Why:** Instant swap between auth modes is jarring. Emil's 150 ms fade-slide goes unnoticed — that's the goal.

---

### Task 4 — `latest-offers.tsx`: fix spring violations (P0)
**File:** `src/components/layout/latest-offers.tsx`
**Recipe:** Emil — no bounce on workhorse; ≤300 ms mount; no stagger > 300 ms total
**Change:**
```tsx
// cardVariants — replace spring with ease-out, cap duration
visible: {
  opacity: 1, y: 0, scale: 1,
  transition: { duration: 0.2, ease: "easeOut" },  // was: spring stiffness:100 damping:15
},

// titleVariants — cap duration
visible: {
  opacity: 1, y: 0,
  transition: { duration: 0.2, ease: "easeOut" },  // was: 0.6
},

// stagger delay — cap at 0.05 so 6 cards = 0.3 s total
staggerChildren: 0.05,  // was: 0.15

// whileHover — remove spring, use ease-out
whileHover={{
  y: -4,  // was -8 (too dramatic)
  transition: { duration: 0.15, ease: "easeOut" }  // was: spring stiffness:400 damping:25
}}
// Remove boxShadow from whileHover (GPU-unfriendly property)
```
**Why:** Spring with low stiffness/damping bounces. `boxShadow` in `whileHover` is GPU-unfriendly. Stagger 0.15 × 8 cards = last card enters at 1.2 s, long after the user has scrolled past.

---

### Task 5 — Home page: Jakub mount recipe on marketing sections (P1)
**File:** `src/app/[locale]/page.tsx` + each home section component
**Recipe:** Jakub §2.2 — marketing-surface enters only
**Change:**
```tsx
// In page.tsx, wrap each section:
import { motion } from "framer-motion";
const jakub = {
  initial: { opacity: 0, translateY: 8, filter: "blur(4px)" },
  animate: { opacity: 1, translateY: 0, filter: "blur(0px)" },
  transition: { type: "spring", duration: 0.45, bounce: 0 },
};

<motion.div {...jakub}><HeroSection /></motion.div>
<motion.div {...jakub}><BrandCarouselSection /></motion.div>
<motion.div {...jakub}><FeaturedOpportunityStrip /></motion.div>
// etc. for each section — each fires once on mount, not on scroll
```
**Why:** Home page currently renders with zero mount animation. Marketing surfaces are Jakub's domain: opacity + translateY + blur enter goes unnoticed but elevates perceived quality.

---

### Task 6 — `AlertRibbon` dismiss: fade + height collapse (P1)
**File:** `src/components/home/` (AlertRibbon component, referenced in hero)
**Recipe:** Jakub conditional-render exit §2.3 + `motion.div layout`
**Change:**
```tsx
// before
{ribbonVisible && <AlertRibbon />}

// after
<AnimatePresence>
  {ribbonVisible && (
    <motion.div
      layout
      key="alert-ribbon"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      className="overflow-hidden"
    >
      <AlertRibbon />
    </motion.div>
  )}
</AnimatePresence>
```
**Why:** Instant removal shifts the hero layout. `motion.div layout` collapses height smoothly so content below doesn't jump.

---

### Task 7 — FAQ accordion: verify Radix height animation (P1)
**File:** `src/components/ui/accordion.tsx`
**Recipe:** Emil §2.5 — smooth height
**Change (if `AccordionContent` lacks overflow + animate-out):**
```tsx
// Ensure AccordionContent has:
className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
// And in globals.css @layer base:
[data-slot="accordion-content"] {
  interpolate-size: allow-keywords;
}
```
**Why:** Radix Accordion animates via CSS data-state attributes. If the shadcn wrapper omits `overflow-hidden` or the animate classes, height clips abruptly. Verify before shipping.

---

### Task 8 — `cookie-consent.tsx`: normalize to Jakub recipe (P1)
**File:** `src/components/layout/cookie-consent.tsx:41`
**Recipe:** Jakub §2.2
**Change:**
```tsx
// before
initial={{ y: "100%" }}
animate={{ y: 0 }}
exit={{ y: "100%" }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// after
initial={{ opacity: 0, y: "100%", filter: "blur(4px)" }}
animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
exit={{ opacity: 0, y: "100%", filter: "blur(2px)", transition: { duration: 0.2 } }}
transition={{ type: "spring", duration: 0.45, bounce: 0 }}
```
**Why:** Current recipe is inconsistent with the Jakub standard (no opacity/blur envelope). One recipe across all marketing surfaces.

---

### Task 9 — `OnboardingCard` step completion: Jhey tick delighter (P1)
**File:** `src/components/dashboard/onboarding-card.tsx`
**Recipe:** Jhey §2.6 — selective delighter
**Change:**
```tsx
// Replace static Icon render with animated version
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence mode="wait">
  {s.done ? (
    <motion.span
      key="done"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.4 }}
    >
      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
    </motion.span>
  ) : (
    <motion.span key="pending">
      <Circle className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
    </motion.span>
  )}
</AnimatePresence>
```
**Why:** Jhey delighters are reserved for moment-of-completion celebrations. This is one of three approved Jhey surfaces (per MOTION.md §1). `bounce: 0.4` is allowed here specifically because it's a delighter, not workhorse.

---

### Task 10 — `BrandLogoCarousel`: add Jhey scale micro-interaction (P2)
**File:** `src/components/design/brand-logo-carousel.tsx`
**Recipe:** Jhey §2.6
**Change:**
```tsx
// before
className="… grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition"
// after
className="… grayscale opacity-70 hover:opacity-100 hover:grayscale-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
```
**Why:** Brand logo hover is an approved Jhey delighter surface. Minor scale adds tactile feel without distracting from the page. `transition-all duration-200` covers opacity + grayscale + scale in one declaration.

---

### Task 11 — Dashboard/admin forms: enforce pattern for conditional fields (P2)
**Files:** Future forms under `src/app/[locale]/dashboard/` and `src/app/[locale]/admin/`
**Recipe:** Emil §2.4 tab swap, applied to conditional field groups
**Change (template to enforce on all new conditional renders):**
```tsx
// Any {condition && <FieldGroup />} that affects visible layout must be:
<AnimatePresence>
  {condition && (
    <motion.div
      key="field-group-id"
      initial={{ opacity: 0, translateY: 4 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -4 }}
      transition={{ duration: 0.15 }}
    >
      <FieldGroup />
    </motion.div>
  )}
</AnimatePresence>
```
**Why:** Dashboard forms are workhorse UI. Emil's 150 ms fade-slide prevents jarring layout shifts when conditional fields appear/disappear.

---

### Task 12 — Confirm `Toaster` (Sonner) built-in motion (P2)
**File:** `src/app/[locale]/layout.tsx` + `src/components/ui/sonner.tsx`
**Recipe:** N/A — verify only
**Change:** None expected. Sonner ships with built-in slide-in/slide-out animation. Verify that the `<Toaster />` in `layout.tsx` does not have `gap` or `position` props that could interfere. Also verify no `duration` override disables animation.
**Why:** Sonner's animation is production-quality. Do not add framer-motion on top. Just confirm it works.

---

## Section 3 — Verification Plan

| Task | Verification |
|------|-------------|
| T1 — globals.css reduced-motion | macOS System Settings → Accessibility → Display → "Reduce motion" ON. All transitions and animations must collapse to snap (≤0.01 ms). Check hover, accordion, carousel, cookie banner. |
| T2 — Command palette | Open Cmd+K, verify no overshoot on enter. Should feel instant-clean, not springy. |
| T3 — Auth form toggle | Click "Create account" link → mode switches with 150 ms fade-slide. Click "Forgot password" → same. No abrupt swap. |
| T4 — Latest offers spring | Scroll to latest offers strip: no card bounce on mount. Hover a card: smooth `y: -4` lift, no overshoot. Last card enters within 300 ms of section mount (stagger 0.05 × 6 = 0.3 s). |
| T5 — Home sections | Hard-reload `/`. All sections should fade+slide in smoothly on first paint. No layout shift. |
| T6 — AlertRibbon dismiss | Click X on hero ribbon: content collapses height smoothly (not snap), hero content flows up with no jump. |
| T7 — FAQ accordion | Click any FAQ item: content height expands smoothly. Close: smooth collapse. No clip. |
| T8 — Cookie consent | Clear `cookie-consent` from localStorage, reload. Banner slides up with opacity+blur envelope. Dismiss: slides down. |
| T9 — OnboardingCard tick | In dashboard, complete an onboarding step. Icon transitions from Circle → CheckCircle2 with spring pop. |
| T10 — Brand logos | Hover any logo: scale 1.02 + opacity 100 + grayscale removed, all in 200 ms. |
| T11 — Dashboard conditional fields | (When forms are built) Reveal/hide conditional fields via toggle: 150 ms fade-slide, no layout jump. |
| T12 — Toaster | Trigger a toast (e.g., submit a form). Sonner slides in from bottom-right with built-in animation. No double-animation. |

**No-regression check:** After all tasks, run `npm run build` to confirm no TypeScript errors introduced by framer-motion imports.
