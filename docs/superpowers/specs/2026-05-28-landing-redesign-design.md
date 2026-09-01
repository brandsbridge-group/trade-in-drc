# Landing Page Redesign — Navy + Gold Marketing Homepage

**Date:** 2026-05-28
**Status:** Approved direction (hero A+C, mimic both Congo reference images)
**Origin:** Customer (Congo) sent two reference mockups. They want the homepage to be a *marketing/eye-candy* landing page in the navy + gold style of the "About Us" reference — NOT the functional app-like dashboard currently shown. Other functionality (navigation tabs, signed-in user + admin areas) is preserved untouched.

## Problem

The current homepage embeds a functional dashboard mockup in the hero. The customer finds this "not fancy" and wants to impress visitors ("göz boyamak") with a polished, informational landing page. They supplied two design references:

- **Image 1** — landing reference: cobalt hero with "Trade in DRC", Africa-map + Kinshasa-skyline visual, an embedded dashboard (the part they DON'T want functional), three feature cards, a trust ribbon.
- **Image 2** — About Us reference (the chosen **style guide**): deep navy + gold palette, big bold headline "CONNECT DRC TO THE WORLD. CREATE LOCAL VALUE.", mission banner, four value cards, a transformation banner, and a gold/navy "Join the platform" CTA bar.

## Decisions

1. **Palette scope:** Homepage gets the full navy + gold treatment. The shared **navbar + footer adopt navy+gold accents** (logo subtitle "CONNECT. TRADE. GROW.", gold Login button, gold active-link underline). Inner page *bodies* (Partners, Opportunities, Sectors, etc.) keep their current cobalt styling — out of scope.
2. **Hero = Option A + C:** split navy hero (left copy, right Kinshasa-skyline + Africa/DRC map composite) WITH floating **static** stat chips (illustrative numbers, non-functional eye-candy).
3. **No functional dashboard** anywhere on the landing. "Explore Opportunities" CTA links into the app (`/opportunities`); "Find Partners" → `/companies`.
4. **Continuation:** below the hero/features, the page continues with Image 2's About story sections.
5. **Backup:** the current homepage composition is preserved at route `/[locale]/home-classic`; existing `src/components/home/*` components are left intact. Only `page.tsx` swaps to the new composition.

## Palette tokens (navy + gold)

| Token | Value | Use |
|---|---|---|
| `--landing-navy` | `#10204A` (deep) → `#1B2F5E` (mid) | hero/banner backgrounds, headings |
| `--landing-navy-2` | `#0E1C44` | gradient darkest stop |
| `--landing-gold` | `#D9A441` | accent word, CTAs, underlines, icon rings |
| `--landing-gold-ink` | `#10204A` | text on gold surfaces |
| navy text on light | `#16234D` | section headings on white |

Added as scoped CSS vars in `globals.css` (prefixed `--landing-*`) so global brand tokens are untouched. Tailwind utility access via arbitrary values or a small set of `landing-*` classes.

## Page structure (`src/app/[locale]/page.tsx`)

1. **Navbar** (shared, restyled accents)
2. **LandingHero** — navy gradient. Eyebrow, "Trade in DRC" (DRC in gold), subhead, paragraph, CTAs `[Explore Opportunities →]` `[Find Partners]`, trust chips. Right: skyline + Africa/DRC SVG-map composite with 3 floating static stat chips.
3. **LandingFeatures** — 3 white cards: Verified Partners · Market Opportunities · Business Intelligence (navy/gold icons, gold underline accent).
4. **LandingTrustRibbon** — navy band: "Trusted Connections. Real Opportunities. *Sustainable Growth.*" (last phrase gold).
   --- About continuation (Image 2) ---
5. **LandingAboutIntro** — "ABOUT US" gold eyebrow + "Connect DRC to the world. *Create local value.*" + intro paragraph.
6. **LandingMissionBanner** — navy banner, target icon in gold ring, mission sentence, gold decorative motifs.
7. **LandingValueCards** — 4 cards: Who We Are · Our Vision · Our Values (checklist) · What We Enable (checklist). Circular outline icons, navy headings, gold underline, faint city/map line-art footer.
8. **LandingTransformBanner** — navy banner: "Trade in DRC transforms business relationships into concrete opportunities for the *growth of the DRC*." + gold DRC-map motif.
9. **LandingJoinCta** — split bar: gold left "Join the platform →" → `/register`; navy right "Connect. Trade. Grow in DRC."
10. **Footer** (shared, restyled accents)

Components live in `src/components/home/landing/` (one file each, <300 lines). Server components where possible; `"use client"` only for motion wrappers.

## Visual assets

- **Skyline:** reuse `public/images/kinshasa-skyline.jpg`.
- **Africa/DRC map:** inline **SVG** component (`drc-africa-map.tsx`) — navy Africa silhouette, DRC highlighted with gold/blue glow, network nodes + connecting lines. Themeable, crisp, no external dependency (honors the open-source/self-host constraint). If the customer later wants pixel-exact parity with the reference raster, swap in a generated composite under `/public/images/` — interface stays the same.

## Stat chips (static)

Centralized named constants in `landing-hero.tsx` (e.g. `HERO_STATS`), marked clearly as illustrative marketing figures, not live data. No DB calls. Values: Opportunities 1,248 · Verified Partners 842 · Market Insights 356.

## i18n

New `Landing` namespace in `src/config/messages/{en,fr,tr,zh,es}.json`. Author exact copy from the reference images for `en`; translate `fr`; mirror keys into `tr/zh/es` (reuse `en` strings as placeholders to avoid missing-key errors; flagged for later translation per `src/i18n/` deferred-locale policy). Reuse existing `About` strings where copy matches.

## Motion (per docs/MOTION.md — Emil primary)

- Section mounts: fade + 8px rise, ≤300 ms, staggered via existing `MotionEnter`.
- Hover on cards/CTAs: ≤180 ms, translateY(-2px) + border/elev change.
- Marketing-surface hero enter ≤500 ms max.
- Respect `prefers-reduced-motion` (global rule covers Tailwind; per-component for framer-motion). Stat chips: gentle float disabled under reduced-motion.
- No new easings/durations beyond MOTION.md recipes.

## Out of scope

Inner-page body redesigns, dashboard/admin, auth flows, search, data model. Navbar/footer changes limited to accent colors + logo subtitle.

## Acceptance

- [ ] `/` renders the new navy+gold landing with all 9 sections; no functional dashboard present.
- [ ] Hero CTAs route to `/opportunities` and `/companies`/`/register`.
- [ ] Navbar Login button + active underline use gold; logo shows "CONNECT. TRADE. GROW." subtitle; footer uses navy+gold accents.
- [ ] `/home-classic` renders the previous homepage composition unchanged (backup intact).
- [ ] EN + FR fully translated; tr/zh/es load without missing-key errors.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] `prefers-reduced-motion` disables non-essential motion.
- [ ] Responsive: hero stacks on mobile; stat chips reflow/hide gracefully.
