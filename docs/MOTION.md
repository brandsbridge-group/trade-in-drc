# TradeInDRC — Motion Principles

**Status:** Authoritative. Every animation in this codebase must obey these rules.
**Source skill:** `design-motion-principles` (Anthropic skill catalog).
**Confirmed weighting (2026-05-18):** Emil primary · Jakub secondary · Jhey selective.

> "The best animation is that which goes unnoticed."
> — Golden rule. If a reviewer mentions an animation, it's probably too prominent.

---

## 1. Designer lenses we apply

Order of authority when a decision conflicts:

1. **Emil Kowalski** (Linear) — Primary
   *Restraint, speed, purposeful motion.* Use for the entire dashboard, admin, list pages, detail pages, inputs, buttons, tab switches, hovers. Target: **≤180 ms** for hover/snap interactions, **≤300 ms** for page-mount enters. Linear easing or `ease-out`. No bounce on workhorse UI.

2. **Jakub Krehel** (jakub.kr) — Secondary
   *Production polish.* Use for marketing-surface enters (home hero, featured strip, brand carousel, FAQ accordions, auth shell). Spring + blur recipe (below). Subtler exits than enters.

3. **Jhey Tompkins** (@jh3yy) — Selective only
   *Playful delighters.* Reserved for: Add-RFQ tile hover, BrandLogoCarousel scroll-snap, OnboardingCard step completion check, brand logo grayscale-to-color hover. NOT on the workhorse surface.

---

## 2. Standard recipes — copy these, don't invent

### 2.1 Hover / state transition (Emil — DEFAULT)

```tsx
className="… transition-all duration-150 ease-out"
// or shorthand:
className="… transition"
```

Browsers default `transition` to 150 ms ease — perfect. Don't override unless you have a reason.

### 2.2 Page / section enter (Jakub)

```tsx
import { motion } from "framer-motion";

<motion.section
  initial={{ opacity: 0, translateY: 8, filter: "blur(4px)" }}
  animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
  transition={{ type: "spring", duration: 0.45, bounce: 0 }}
>
```

Used for: home hero, featured strip, brand carousel, FAQ panel, list-page main column. Not for individual cards (would feel busy).

### 2.3 Conditional-render exit (Jakub)

Exit should be subtler than enter — smaller `translateY`, same blur, faster:

```tsx
exit={{ opacity: 0, translateY: 4, filter: "blur(2px)", transition: { duration: 0.2 } }}
```

Wrap in `<AnimatePresence mode="wait">` for sequential swaps (auth-form mode toggle, ExplorerTabs grid swap).

### 2.4 Tab / accordion swap (Emil)

Always wrap conditional children in `<AnimatePresence mode="wait">`:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, translateY: 4 }}
    animate={{ opacity: 1, translateY: 0 }}
    exit={{ opacity: 0, translateY: -4 }}
    transition={{ duration: 0.15 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

### 2.5 Accordion height (Emil + browser)

`<details>` doesn't smoothly animate height. Use the `interpolate-size: allow-keywords` CSS feature OR a Framer `height: auto` controlled component. The browser-native approach:

```css
details { interpolate-size: allow-keywords; transition: height 0.2s ease; }
details::details-content { transition: opacity 0.2s ease; }
```

### 2.6 Delighter hover (Jhey — selective)

For Add-RFQ tile, brand logos, onboarding step completion:

```tsx
className="… hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
```

Image inside a card on hover (already in `ProductCardDesign`):

```tsx
<img className="group-hover:scale-[1.02] transition-transform duration-300" />
```

### 2.7 Full-phase swap (Emil-capped Jakub) — gate ↔ wizard

For a hard swap between two entire screens that must never be visible at
once — e.g. registration's Profile Gate ↔ Stepper/Wizard (P2-1) — combine
Jakub's blur-exit shape (§2.3) with Emil's mount-duration cap (≤300 ms)
instead of Jakub's full 450 ms: this swap is closer to a big tab switch than
a marketing-surface reveal, so it should feel snappy, not showy.

```tsx
<AnimatePresence mode="wait" initial={false}>
  {phase === "a" ? (
    <motion.div
      key="a"
      initial={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 4, filter: "blur(2px)", transition: { duration: 0.2 } }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
    >
      <A />
    </motion.div>
  ) : (
    <motion.div key="b" /* same props */>
      <B />
    </motion.div>
  )}
</AnimatePresence>
```

`mode="wait"` is what guarantees the two screens never compete for the same
viewport — the exiting phase fully unmounts before the entering one mounts.
Reduced motion collapses to a flat 0.15s opacity fade on both enter and
exit (see §4.2) — no translate, no blur.

---

## 3. Forbidden patterns

Reject these in review:

- **Hover transitions over 300 ms.** Slow hovers feel laggy. Cap at 200 ms.
- **Bounce on workhorse UI** (forms, buttons, tab switches, dropdowns). Reserve bounce for delighters only.
- **`AnimatePresence` missing on conditional renders.** Always wrap `{x && <Y/>}` or `condition ? <A /> : <B />` that affects visible UI.
- **Inline-style transitions** (`style={{ transition: "..." }}`). Use Tailwind utilities or framer-motion props.
- **Layout shifts during enter.** Use `translateY` + `opacity`, not `height: 0 → auto` without `motion.div layout`.
- **GPU-unfriendly properties.** Don't animate `top`, `left`, `width`, `height` (except via `layout`). Stick to `transform` + `opacity` + `filter`.
- **Animating on every state change.** Hover-only is fine. Mount-only enters fire once. Don't loop animations forever on idle UI.

---

## 4. Accessibility — NEVER skip

Every animation MUST respect `prefers-reduced-motion`. Two patterns:

### 4.1 Tailwind global

Add to `globals.css` `@layer base`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 4.2 Per-component framer-motion

```tsx
import { useReducedMotion } from "framer-motion";

const reduce = useReducedMotion();
<motion.div
  initial={reduce ? false : { opacity: 0, translateY: 8 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ duration: reduce ? 0 : 0.45 }}
/>
```

The Tailwind global rule covers 90% of cases. Per-component is for framer-only animations where the Tailwind rule doesn't apply.

---

## 5. Where each animation lives

### Already animated (verify they follow the recipes)
- `src/components/register/market/register-wizard.tsx` — Profile Gate ↔ Stepper/Wizard phase swap, §2.7 recipe ✓
- `src/components/design/product-card-design.tsx` — image hover scale ✓
- `src/components/design/company-row.tsx` — border hover transition ✓
- `src/components/design/opportunity-card-design.tsx` — border hover ✓
- `src/components/design/featured-opportunity-strip.tsx` — dashed Add-RFQ tile hover ✓
- `src/components/design/brand-logo-carousel.tsx` — grayscale-to-color hover ✓
- `src/components/design/filter-sidebar.tsx` — chevron rotate on group toggle ✓
- `src/components/design/hero-search.tsx` — tab transition ✓
- `sonner` toasts — built-in animations

### Motion gaps to fix (audit will plan these)
- Hero `<AlertRibbon>` dismiss — currently instant disappear
- ExplorerTabs grid swap — instant content swap
- FAQ `<details>` accordions — no smooth height
- Auth form mode toggle (login/signup/reset) — instant swap
- Conditional sections on dashboard product-form
- OnboardingCard step completion — no celebration on tick
- Page-level enters on home (no Jakub recipe applied yet)

---

## 6. Workflow when adding any new animation

1. Decide which lens applies (default Emil; Jakub if it's a marketing-surface mount; Jhey only if explicitly a delighter).
2. Copy the recipe from §2.
3. Verify `prefers-reduced-motion` is respected (the global rule in §4.1 covers it for Tailwind, but if you wrote framer JSX directly, add §4.2).
4. Test by running `npm run dev` with macOS System Settings → Accessibility → Display → "Reduce motion" toggled ON. The animation should collapse to a snap.
5. Read this file before writing the animation. If the recipe you want isn't here, propose adding it before shipping.

---

## 7. Reviewer checklist

When reviewing any PR that touches motion:

- [ ] Duration ≤ 200 ms for hovers; ≤ 300 ms for mounts; ≤ 500 ms only for marketing-surface enters with Jakub recipe.
- [ ] No `shadow` is animated (animate `transform` or `filter` instead).
- [ ] Every conditional render that swaps visible UI is wrapped in `<AnimatePresence>`.
- [ ] `prefers-reduced-motion` is respected (visible by toggling the OS setting).
- [ ] No bounce on workhorse UI.
- [ ] No animation longer than 300 ms is justified inline with a comment.
