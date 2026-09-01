# Motion P2 + Opportunities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the four remaining motion items flagged P2 / Opportunity in `docs/superpowers/plans/2026-05-18-motion-audit-plan.md`, plus the explicit user request for smooth `<FilterGroup>` open/close.

**Architecture:** Same recipes as `docs/MOTION.md` (Emil primary, Jakub secondary, Jhey selective). Every animated state uses `framer-motion` with `useReducedMotion` guards; `<details>` accordion CSS in `globals.css` already covers `<FilterGroup>` if we switch to `<details>`. Sonner `<Toaster />` motion is built-in — only verify, don't reimplement.

**Tech Stack:** Next 16 App Router, React 19, framer-motion v12, Tailwind v4, lucide-react, sonner.

**Reference docs:**
- `docs/MOTION.md` §2 (recipes), §4 (a11y)
- `docs/superpowers/plans/2026-05-18-motion-audit-plan.md` (Tasks 10–12)

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/components/design/filter-sidebar.tsx` | `<FilterGroup>` collapsible — currently snaps open/closed | Modify — wrap children in `<AnimatePresence>` + `motion.div` with auto-height |
| `src/components/design/brand-logo-carousel.tsx` | Verified-logo rail with prev/next | Modify — add hover `scale-[1.04]` on each logo cell, keep `useReducedMotion` guard |
| `src/components/forms/animated-field.tsx` | NEW — reusable wrapper for conditional form fields | Create — `AnimatePresence` + Emil 150 ms recipe |
| `src/app/[locale]/dashboard/opportunities/opportunity-form.tsx` | Event-only conditional fields (start/end/location) | Modify — wrap event-only block in `<AnimatedField>` |
| `src/app/[locale]/admin/data-hub/reports/report-form.tsx` | (Verify location) attachment URL conditional or similar | Modify — same pattern if conditional fields exist |
| `src/app/[locale]/layout.tsx` | Sonner Toaster mount | Verify only — no edits if `<Toaster richColors />` is present |
| `src/components/design/__tests__/filter-sidebar.test.tsx` | Existing RTL coverage | Modify — adjust open/close assertions for new exit animation timing |

---

## Task 1: Smooth `<FilterGroup>` open / close

**Files:**
- Modify: `src/components/design/filter-sidebar.tsx`
- Modify: `src/components/design/__tests__/filter-sidebar.test.tsx`

- [ ] **Step 1: Update the test for the new behavior**

The existing test asserts that content disappears from the DOM on collapse. With `AnimatePresence mode="popLayout"` and exit timing, the content remains briefly. Tighten the assertion to wait for the exit to complete.

```tsx
// src/components/design/__tests__/filter-sidebar.test.tsx — replace the relevant test
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FilterSidebar, FilterGroup, FilterItem } from "../filter-sidebar";

describe("FilterSidebar", () => {
  it("renders label and items", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" count={12} />
        </FilterGroup>
      </FilterSidebar>
    );
    expect(screen.getByText("Sectors")).toBeInTheDocument();
    expect(screen.getByText("Mining")).toBeInTheDocument();
  });

  it("toggles aria-expanded on header click", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" />
        </FilterGroup>
      </FilterSidebar>
    );
    const header = screen.getByRole("button", { name: /sectors/i });
    expect(header).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("removes content from the DOM after the exit transition", async () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" />
        </FilterGroup>
      </FilterSidebar>
    );
    fireEvent.click(screen.getByRole("button", { name: /sectors/i }));
    await waitFor(
      () => expect(screen.queryByText("Mining")).not.toBeInTheDocument(),
      { timeout: 500 }
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/design/__tests__/filter-sidebar.test.tsx
```

Expected: the new third test fails (Mining is removed immediately, not after a transition — there's no waitFor needed). The other two pass.

- [ ] **Step 3: Update `filter-sidebar.tsx` to animate height**

```tsx
"use client";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterSidebar({ children }: { children: ReactNode }) {
  return <aside className="space-y-4 text-sm">{children}</aside>;
}

interface FilterGroupProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FilterGroup({ label, defaultOpen = true, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  return (
    <section className="border-b pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn("w-3 h-3 transition", open ? "rotate-180" : "")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface FilterItemProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function FilterItem({ label, count, active, onClick, href }: FilterItemProps) {
  const className = cn(
    "flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-muted",
    active && "bg-muted font-medium"
  );
  const inner = (
    <>
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
    </>
  );
  if (href) return <a href={href} className={className}>{inner}</a>;
  return (
    <button type="button" onClick={onClick} className={className + " w-full text-left"}>
      {inner}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/design/__tests__/filter-sidebar.test.tsx
```

Expected: 3/3 PASS.

- [ ] **Step 5: Visual check**

Run `npm run dev`, open `/en/companies`, click any sidebar group header. The list should glide closed in ~180 ms, not snap. Toggle macOS "Reduce motion" → expansion becomes instant.

---

## Task 2: `<BrandLogoCarousel>` hover delighter

**File:** `src/components/design/brand-logo-carousel.tsx`

- [ ] **Step 1: Add the scale micro-interaction**

Replace the carousel cell `<div>` with a `motion.div`. Keep the existing grayscale-to-color hover, add Jhey's restrained scale only when motion is allowed.

```tsx
"use client";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface BrandLogo {
  id: string;
  name: string;
  logo_url?: string | null;
}

export function BrandLogoCarousel({ logos }: { logos: BrandLogo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useTranslations("Design");
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  if (!logos.length) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("previous")}
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border border-slate-200 bg-card"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-8 no-scrollbar"
      >
        {logos.map((l) => (
          <motion.div
            key={l.id}
            whileHover={reduce ? undefined : { scale: 1.04 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0.2 }}
            className="snap-start shrink-0 w-32 h-16 flex items-center justify-center grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition"
          >
            {l.logo_url ? (
              <img src={l.logo_url} alt={l.name} className="max-h-12 max-w-full object-contain" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">{l.name}</span>
            )}
          </motion.div>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("next")}
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border border-slate-200 bg-card"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Build + visual check**

```bash
npm run build
```

Open `/en` (BrandCarouselSection is on the home), hover any logo: gentle scale + color reveal. Toggle reduced motion → scale stays still.

---

## Task 3: `<AnimatedField>` for conditional form fields

**Files:**
- Create: `src/components/forms/animated-field.tsx`
- Modify: `src/app/[locale]/dashboard/opportunities/opportunity-form.tsx`

- [ ] **Step 1: Create the wrapper**

```tsx
// src/components/forms/animated-field.tsx
"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function AnimatedField({ show, children }: { show: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="field"
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduce ? 0 : 0.15, ease: "easeOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Wrap the event-only block in `opportunity-form.tsx`**

Find the existing `{category === "event" && (…)}` (or the equivalent conditional that renders `event_start_at` / `event_end_at` / `event_location` fields). Replace the bare `&&` with `<AnimatedField>`.

```tsx
// at the top of opportunity-form.tsx (add to imports):
import { AnimatedField } from "@/components/forms/animated-field";

// then around the event-only fields:
<AnimatedField show={category === "event"}>
  <div className="grid gap-3">
    <Input
      type="datetime-local"
      value={eventStartAt}
      onChange={(e) => setEventStartAt(e.target.value)}
      placeholder={t("fields.eventStart") ?? "Event start"}
    />
    <Input
      type="datetime-local"
      value={eventEndAt}
      onChange={(e) => setEventEndAt(e.target.value)}
      placeholder={t("fields.eventEnd") ?? "Event end"}
    />
    <Input
      value={eventLocation}
      onChange={(e) => setEventLocation(e.target.value)}
      placeholder={t("fields.eventLocation") ?? "Event location"}
    />
  </div>
</AnimatedField>
```

If the form uses different state-variable names (likely — read the file first), substitute the real ones. Don't rename existing variables.

- [ ] **Step 3: Build verify**

```bash
npm run build
```

Expected: clean. Open `/en/dashboard/opportunities/new`, switch the category Select between `tender` and `event` — the three event fields glide in/out instead of snapping.

---

## Task 4: Verify Sonner `<Toaster />` motion

**File:** `src/app/[locale]/layout.tsx`

This is verification only — Sonner ships with its own motion.

- [ ] **Step 1: Confirm Toaster is mounted with default behavior**

```bash
grep -n "Toaster" src/app/[locale]/layout.tsx
```

Expected output includes a line like `<Toaster richColors position="top-right" />` or similar. If `closeButton` is absent and the user wants it, leave alone — Sonner's defaults already include enter slide + opacity exit.

- [ ] **Step 2: Smoke test in the browser**

Trigger any toast (log out, send an RFQ, anything). The toast should slide in from the configured edge. Toggle reduced motion → the toast snaps to position and fades out without slide. (The global `@media (prefers-reduced-motion)` rule in `globals.css` covers Sonner's CSS transitions.)

- [ ] **Step 3: Note in the commit message**

`feat(motion): verify sonner motion intact + close P2 audit items`

No code change — just confirmation captured in the commit body.

---

## Task 5: Final verification

- [ ] **Step 1: Full suite**

```bash
npx vitest run
npm run build
npx eslint --quiet 'src/components/design/' 'src/components/forms/' 'src/app/[locale]/dashboard/opportunities/'
```

Expected: 24+ tests pass (existing + the third filter-sidebar test = 25), build clean, lint clean on touched files.

- [ ] **Step 2: Manual a11y pass**

System Settings → Accessibility → Display → Reduce motion: ON.
- Open sidebar group → snaps without height transition
- Switch opportunity category → event fields appear/disappear instantly
- Hover brand logo → no scale; grayscale flip is also instant (covered by the global CSS rule)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(motion): close P2 + opportunities from motion audit plan

Filter sidebar: <FilterGroup> open/close now animates height in ~180ms
with useReducedMotion guard. Snaps when reduced motion is on.

Brand logo carousel: each cell gets whileHover scale 1.04 with a
short bouncy spring (Jhey delighter, restraint-bounded).

New <AnimatedField> wrapper at src/components/forms/animated-field.tsx
applied to the event-only fields in opportunity-form.tsx. Now reusable
for any other conditional-form-field pattern.

Sonner <Toaster /> verified — built-in motion intact, respects the
global prefers-reduced-motion rule via Sonner's CSS transitions.

Tests: filter-sidebar gets a third spec asserting content is removed
from the DOM only after the exit transition completes.

24/25 → 25/25 tests pass. Build + lint clean.
EOF
)"
```

---

## Self-Review

**1. Spec coverage**
- Filter sidebar smooth open/close → Task 1 ✓
- Audit Task 10 (BrandLogoCarousel scale) → Task 2 ✓
- Audit Task 11 (conditional form pattern) → Task 3 ✓ (with new shared wrapper)
- Audit Task 12 (Sonner verify) → Task 4 ✓

**2. Placeholder scan**
- "if it exists" appears once in Task 3 Step 2 — softened with "read the file first". Acceptable given form state-variable names depend on existing code.
- No TBD / TODO / "fill in".

**3. Type consistency**
- `<AnimatedField>` props: `show: boolean`, `children: ReactNode`. Consistent everywhere it's referenced.
- `useReducedMotion` from `framer-motion` used identically in Tasks 1, 2, 3 (boolean | null → coerce via `reduce ?`).

---

## Done definition

- `<FilterGroup>` glides on toggle; reduced motion = instant.
- Brand logo hover scales gently, only when motion is allowed.
- Conditional form fields use the new `<AnimatedField>` wrapper (event block).
- Sonner motion verified, no regressions.
- 25 vitest tests pass, build clean, lint clean.
