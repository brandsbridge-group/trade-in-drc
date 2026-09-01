# Navbar responsive overflow — "More ▾" priority nav

**Date:** 2026-07-21
**Status:** Approved → implementing

## Problem

The top navbar has grown to 10 top-level links + search + language switcher + two
text CTA buttons + Log in. The desktop nav appears at the `xl` breakpoint (1280px),
but the full set only fits at ~1600px+. On common laptop widths (1280–1500px) the
right-side cluster overflows off-screen (the "Post a Buying Request" CTA and Log in
get clipped).

## Approach (chosen)

Priority + "More ▾" overflow — keep primary links inline, tuck the rest under a
dropdown. Pure-CSS responsive tiers (no JS width-measuring, so no flicker).

### Link split (10 total)

- **Primary (always inline at `xl`+):** Home · Companies · Opportunities · Marketplace
- **Overflow (under "More ▾"):** Local Contacts · Services · Events · Market
  Intelligence · Promote Your Business · Contact

### Responsive tiers

| Width | Behavior |
|---|---|
| `< xl` (1280px) | Existing ☰ hamburger Sheet (lists every page) — unchanged |
| `xl`–`2xl` (1280–1536px) | Primary 4 inline **+ "More ▾"** dropdown with the other 6 |
| `≥ 2xl` (1536px) | All 10 links inline; no "More" |

### Implementation

- `PRIMARY_LINKS` + `OVERFLOW_LINKS` arrays derived from the existing `navLinks`.
- Primary links render as now (unchanged styling).
- Overflow links render twice:
  - inline with `hidden 2xl:flex` (visible only ≥ 2xl),
  - inside a shadcn `DropdownMenu` ("More ▾") wrapped in `xl:flex 2xl:hidden` (visible only in the middle tier).
- "More ▾" trigger gets the active red-underline treatment when the current
  pathname matches one of the overflow links (so the user still sees where they are).
- New i18n key `Nav.moreMenu` = "More" across all 5 locales.
- Compact CTAs (Register / Post / Log in) unchanged.

### Non-goals

- No JS/ResizeObserver measuring (priority+ true auto-fit) — the static split is
  robust and predictable.
- No change to the mobile Sheet menu or the CTA buttons.
