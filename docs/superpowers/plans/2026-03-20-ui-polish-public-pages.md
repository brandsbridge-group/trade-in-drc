# UI Polish — Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix all "AI slop" UI issues on public-facing pages — reduce oversized padding/margins/text, remove generic decorative elements, establish consistent spacing system, achieve a professional government portal aesthetic.

**Architecture:** Tailwind class replacements only — no structural changes, no new components.

**Design Principles:**
- Small paddings, small text, information density
- Lucide outline icons only, single brand color
- Light theme, professional/official government feel
- No rounded-none (use rounded-md), no decorative gradients/patterns
- Consistent spacing: py-8 sections, py-12 max for major breaks, gap-4 standard, gap-6 max

---

## Task 1: Global CSS Typography Scale

**Files:** `src/app/globals.css`

- [ ] Reduce h1 scale: max text-4xl (remove text-5xl, text-6xl, text-7xl variants)
- [ ] Reduce h2 scale: max text-2xl md:text-3xl
- [ ] Reduce h3 scale: text-lg md:text-xl
- [ ] Ensure body text is text-sm default
- [ ] Commit: `style: reduce global typography scale for professional feel`

---

## Task 2: Hero Section

**Files:** `src/components/layout/hero.tsx`

- [ ] Reduce height: h-[85vh] → h-[60vh] or min-h-[400px]
- [ ] Remove triple gradient overlay and dot pattern — use single subtle bg-slate-900/90
- [ ] Reduce h1: text-7xl → text-3xl md:text-4xl
- [ ] Reduce space-y-8 → space-y-4
- [ ] Remove mt-[-5vh] hack
- [ ] Buttons: rounded-none → rounded-md, text-sm not text-xs
- [ ] Commit: `style: simplify hero section, reduce sizing`

---

## Task 3: Navbar

**Files:** `src/components/layout/navbar.tsx`

- [ ] Mobile menu: gap-6 → gap-3, mt-6 → mt-3
- [ ] Review search input styling — remove generic yellow if present
- [ ] Ensure compact height
- [ ] Commit: `style: tighten navbar spacing`

---

## Task 4: Footer

**Files:** `src/components/layout/footer.tsx`

- [ ] Reduce section padding to py-8
- [ ] Tighten column gaps
- [ ] Reduce text sizes if oversized
- [ ] Commit: `style: compact footer`

---

## Task 5: Homepage Sections (features, stats, CTA)

**Files:**
- `src/components/layout/features.tsx`
- `src/components/layout/stats.tsx`
- `src/components/layout/cta-section.tsx`

- [ ] features.tsx: py-24 → py-10, mb-16 → mb-6, gap-8 → gap-4, add border to cards
- [ ] stats.tsx: py-20 → py-8, text-4xl values → text-2xl, gap-8 → gap-4, reduce placeholder boxes w-16 h-16 → w-10 h-10
- [ ] cta-section.tsx: py-20 → py-10, p-8 → p-4, gap-12 → gap-4
- [ ] Commit: `style: compact features, stats, CTA sections`

---

## Task 6: Homepage Sections (companies, rising, investment, trade-hub)

**Files:**
- `src/components/layout/featured-companies.tsx`
- `src/components/layout/rising-potential.tsx`
- `src/components/layout/investment-opportunities.tsx`
- `src/components/layout/trade-hub.tsx`

- [ ] featured-companies: w-16 h-16 boxes → w-8 h-8 rounded-md, remove text-xs uppercase on buttons
- [ ] rising-potential: h2 text-5xl → text-2xl md:text-3xl
- [ ] investment-opportunities: py-32 → py-10, remove w-32 h-32 clip-path decoration, h2 text-5xl → text-2xl
- [ ] trade-hub: py-24/py-32 → py-10, gap-12 → gap-4, rounded-none → rounded-md
- [ ] Commit: `style: compact homepage showcase sections`

---

## Task 7: Homepage Components (ticker, sectors, rfq, spotlight)

**Files:**
- `src/components/home/market-ticker.tsx`
- `src/components/home/sectors.tsx`
- `src/components/home/rfq-feed.tsx`
- `src/components/home/supplier-spotlight.tsx`

- [ ] market-ticker: gap-12 → gap-6, review text-xs tracking-widest
- [ ] sectors: h2 text-4xl → text-2xl, pb-8+mb-12 → mb-6, rounded-none → rounded-md
- [ ] rfq-feed: py-20 → py-10, text-4xl → text-2xl
- [ ] supplier-spotlight: h2 text-5xl → text-2xl, w-16 h-16 → w-8 h-8, rounded-none → rounded-md, fix button text-xs uppercase
- [ ] Commit: `style: compact homepage grid components`

---

## Task 8: Static Pages (about, FAQ, contact, companies, blog)

**Files:**
- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/faq/page.tsx`
- `src/app/[locale]/contact/page.tsx`
- `src/app/[locale]/companies/page.tsx`
- `src/app/[locale]/blog/page.tsx`

- [ ] about: h1 text-5xl → text-3xl, step numbers text-5xl → text-2xl, py-16 → py-8
- [ ] faq: py-12 → py-8, h-12 input → h-9, space-y-4 → space-y-2
- [ ] contact: py-16/py-12 → py-8, w-10 h-10 boxes → w-8 h-8, reduce inconsistent padding
- [ ] companies: py-16 → py-8, h-12 → h-9 inputs
- [ ] blog: py-16/pb-12 → py-8, h1 text-5xl → text-3xl
- [ ] Commit: `style: compact static pages`
