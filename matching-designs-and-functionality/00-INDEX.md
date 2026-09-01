# Design vs App Matching — Master Index

**Perspective:** design-first. Scores answer "how much of the design is delivered in the app?", weighted toward the design's structure, content modules, and visual language — not just underlying data plumbing.

**Date:** 2026-07-17 (updated 2026-07-18)
**Pairs analyzed:** 14 (designs 1–13 + Our Services)
**Average match:** ~33% at audit time

**Build progress (one-by-one):**
- 🟡 **Design 1 — Homepage: PARTIALLY DONE** (2026-07-18). Rebuilt `/` as the dense marketplace landing: navy/red/gold DRC palette + tokens, photo-collage hero with 4-facet search, live stats band, 12-category grid, featured products + verified suppliers from Supabase, For Buyers/Sellers banners, and the anonymous buying-request rail (writes `business_requests`). Navbar + footer restyled to navy chrome. **Remaining:** fine visual polish, one-screen density pass, and product/supplier image quality.
- ⬜ All other 13 designs: not started.

---

## 1. Score table (biggest design debt first)

Status: ⬜ not started · 🟡 partially done · ✅ done

| # | Design | App page | Gap doc | Score | Status | One-line summary |
|---|--------|----------|---------|-------|--------|------------------|
| 8 | Explore by Province | `/local-contacts/provinces` (NEW) | [8-by-province.md](8-by-province.md) | **~90** | 🟡 | **Partially done** — new page: DRC choropleth SVG map + 7 pins, real per-province verified counts, 7 key-province row-cards, and the cream Lualaba Featured-Province band with real recommended companies. |
| 11 | Data Hub | `/data-hub` | [11-data-hub.md](11-data-hub.md) | **~90** | 🟡 | **Done** — rebuilt to design 11: skyline+map hero with 4-filter search, 4 stat tiles, KPI cards + 4 inline-SVG charts (trend line / sector bar / companies-by-sector donut / provincial choropleth), reports table, browse-category tiles, and a Request-Custom-Market-Intelligence lead form (→ business_requests, admin-visible). New market_metrics/trade_series/sector_activity tables (migrations 00032/00033). |
| 13 | Events | `/events` | [13-events.md](13-events.md) | **~90** | 🟡 | **Done** — rebuilt to design 13: photo hero + 5-field search, stat tiles, featured events, tabbed upcoming events (real content_items, event_type via migration 00031), events-by-sector, host band, past highlights, and a rail with a working Submit-an-Event form (→ draft, visible at /admin/content/event). |
| 3 | Local Contacts landing | `/local-contacts` (NEW) | [3-local-contacts-landing.md](3-local-contacts-landing.md) | **~90** | 🟡 | **Partially done** — new hub: skyline hero + 4-field search, 6 contact-type cards, 6 sector cards (live counts), Discover/Verify/Connect strip, navy CTA band. Navbar 'Local Contacts' now points here. |
| 4 | Contact Points | `/contact-points` | [4-contact-points.md](4-contact-points.md) | **~90** | 🟡 | **Partially done** — rebuilt to design 4 on a NEW real `institutions` table (14 seeded DRC bodies): 9-category sidebar, search + All-Categories filter, 3-col badge-coded institution cards, Request-Guidance banner. |
| 5 | Company Profile | `/companies/[id]` | [5-company-profile.md](5-company-profile.md) | **~90** | 🟡 | **Partially done** — rebuilt to design 5: 4-step funnel stepper, trust hero (premium pill, logo, chips, action stack), tabs, About+facts / Products / Partnership+Snapshot, on-page Verification Summary table, and anonymous Request-Introduction form (→ `business_requests`). PII-safe fetch preserved. Unknown facts (year/employees/DUNS) show "—" (no schema columns). |
| 2 | Opportunities | `/opportunities` | [2-opportunities.md](2-opportunities.md) | **~90** | 🟡 | **Partially done (90%)** — rebuilt to design 2: photo hero + 4-field search, live stats card, Post-Opportunity card, tabbed Latest-Opportunities board (real published rows joined to company + verified tick + type badges), Submit-Your-Business-Need form, Why-Use panel. Remaining: detail-page "Express Interest" flow + polish. |
| 1 | Homepage | `/` | [1-homepage.md](1-homepage.md) | **~85** | 🟡 | **Partially done** — rebuilt to design 1 (marketplace hero, faceted search, stats band, product/supplier grids, buying-request rail, navy chrome). Remaining: visual polish + density pass. |
| 7 | Verified Directory | `/companies` + `/trust` | [7-verified-directory.md](7-verified-directory.md) | **~90** | 🟡 | **Partially done** — rebuilt `/companies` to design 7: skyline hero, 3-tier badge explainer, horizontal filter bar (sector/province/type + Premium/Intl toggles), 4-col verified company grid, 5-step verification stepper, navy breadcrumb. Note: partnership-type + International-Ready filters have no DB column yet (captured in URL, not filtered). |
| 9 | Explore by Sector | `/sectors` | [9-by-sector.md](9-by-sector.md) | **~90** | 🟡 | **Partially done** — rebuilt to design 9: navy skyline hero + breadcrumb, 3×2 sector cards with live Companies + Verified-Partners counts, and the Mining Featured-Sector band with sub-category mini-cards. |
| — | Our Services | `/services` (NEW) | [our-services.md](our-services.md) | **~90** | 🟡 | **Partially done** — new page: montage hero, 7 service cards, Request-a-Service form (→ `business_requests`, real Request ID, admin-visible), Who-We-Serve panel, 11 sector chips, How-It-Works band. |
| 6 | Register Company | `/register-company` (NEW) | [6-register-company.md](6-register-company.md) | **~90** | 🟡 | **Partially done** — new wizard: navy hero (businessman+flag), 3 pricing tiers (Free/USD 250/USD 3,000), 5-step form (legal/professional/positioning/documents/review), benefits strip. Creates a pending `companies` row (admin-visible). Doc uploads = filenames only (storage TODO). |
| 12 | Pricing / Premium | `/pricing` | [12-pricing.md](12-pricing.md) | **~90** | 🟡 | **Partially done** — rebuilt to design 12: mining-photo hero, floating Compare-Membership-Plans table (Free/Verified/Premium × 12 features), 6-up benefits, What-You-Get + How-It-Works, Book-a-Call band. Apply form writes `business_requests` (admin-visible). |
| 10 | Request a Partner | `/request` | [10-request.md](10-request.md) | **~90** | 🟡 | **Done** — rebuilt to design 10: handshake hero, 3-column flow (8 need tiles → 13-field form + upload → confirmation). Writes `business_requests` with a real TIDRC-PR-YYYY-NNNNNN Request ID (migration 00030); admin-visible at /admin/requests. |

```
Design debt at a glance (score = % of design delivered)

  8  by-province 🟡      ██████████████████░░  ~90  (rebuilt)
 11  data-hub 🟡         ██████████████████░░  ~90  (rebuilt)
 13  events 🟡           ██████████████████░░  ~90  (rebuilt)
  3  local-contacts 🟡   ██████████████████░░  ~90  (rebuilt)
  4  contact-points 🟡   ██████████████████░░  ~90  (rebuilt)
  5  company-profile    ███████░░░░░░░░░░░░░  34
  2  opportunities 🟡   ██████████████████░░  ~90  (rebuilt)
  1  homepage 🟡        █████████████████░░░  ~85  (rebuilt)
  7  verified-directory 🟡 ██████████████████░░  ~90  (rebuilt)
  9  by-sector 🟡        ██████████████████░░  ~90  (rebuilt)
  —  our-services 🟡     ██████████████████░░  ~90  (rebuilt)
  6  register-company 🟡 ██████████████████░░  ~90  (rebuilt)
 12  pricing 🟡          ██████████████████░░  ~90  (rebuilt)
 10  request 🟡          ██████████████████░░  ~90  (rebuilt)
```

---

## 2. Design language the app must adopt

The designs form one coherent visual system that the app has not adopted anywhere. Recurring demands:

### 2.1 DRC-flag palette: navy + red + yellow (+ green ticks)
The designs use **navy #0B1F4B / #0A2A5C / #0B1F60** as the structural color (heroes, topbars, footers, section bands), **red #D8232A** for conversion CTAs (Search, Apply, Submit), **yellow #F5A800/#F5A700** for accents and lead-gen CTAs, and **green** for verified ticks. The app instead uses a navy+gold marketing look on some pages and monochrome shadcn gray/all-blue SaaS on others.
**Affected pages:** all 14 — explicitly called out on 1, 2, 3, 4, 5, 9, 10, 11, 12, our-services.

### 2.2 Photographic navy-overlay heroes with embedded search
Nearly every design opens with a full-bleed DRC photo (Kinshasa skyline, mining, flag-map motif) under a navy overlay, containing a **multi-facet search bar** (keyword + sector + province + type + red submit). The app has abstract or plain-white headers with at most a single text input.
**Affected pages:** 1 (4-facet hero search), 2 (keyword/type/sector/province card), 3 (4-field bar), 7 (navy photo hero), 8, 9 (navy photo hero + breadcrumb), 11 (4-facet bar), 12 (mining photo hero), 13 (5-field event search), our-services (flag-map collage).

### 2.3 Dense bordered white cards on gray canvas
Designs favor compact, information-dense bordered cards in 3–4 column grids with stat lines, badge pills, and explicit `View X →` buttons. The app renders airy full-width rows or minimal cards without CTAs.
**Affected pages:** 1 (product grid), 2 (dense rows), 4 (3-col institution cards), 5 (bordered card system), 7 (4-col company grid), 8 (photo row-cards), 9 (dual-stat sector cards), 13 (event cards).

### 2.4 Verification/trust badges as first-class visual elements
Green Verified ticks, gold "Premium Verified" pills, tinted per-type badges, 3-tier badge explainers, and on-page verification tables. The app hides trust content on a separate `/trust` page and uses plain badges.
**Affected pages:** 2, 5 (verification summary table + hero trust card), 7 (badge explainer + 5-step stepper), 8 (verified-contact counts), 9 (Verified Partners stat).

### 2.5 Persistent lead-capture forms and conversion sidebars
Almost every design carries an embedded, **anonymous** lead form or right-rail conversion module (buying-request rail, Submit Your Business Need, Request Custom Market Intelligence, Submit an Event, Request Contact/Introduction). The app centralizes everything into one `/request` page, often behind login.
**Affected pages:** 1 (right-rail form + 65/35 layout), 2 (full sidebar), 5 (inline anonymous form), 8 (yellow Request-a-Local-Contact CTA), 11 (lead sidebar), 13 (Submit an Event sidebar), our-services (anonymous form vs sign-in gate).

### 2.6 Stats strips and live counts as social proof
Global stat bands (1,240+ opportunities / 420+ companies / 18 sectors / 26 provinces; 156,432 contacts; 350+ reports) plus per-card live counts ("N Companies"). Almost entirely absent from the app.
**Affected pages:** 1, 2, 3, 7 (results count + pagination), 8, 11, 13.

### 2.7 Structural chrome: breadcrumbs, navy topbar/footer, BrandsBridge attribution
Navy breadcrumb bars (orange/current crumb), 4-column navy footers with upgrade CTAs, and BrandsBridge Group SARL branding.
**Affected pages:** 1, 3, 4, 9, 10, our-services.

---

## 3. Design elements missing everywhere (cross-page themes)

1. **Multi-facet search bars** — the single most repeated missing element (10 of 14 pages). No page in the app has a combined keyword/sector/province/type search unit with a red submit.
2. **Featured/spotlight bands** — Featured Products (1), Featured Province (8), Featured Sector (9), Featured Events (13), Market Overview dashboard (11): every hub design has an editorial spotlight; the app has none.
3. **Right-rail conversion sidebars** — designs treat every browse page as a lead-gen surface; the app has zero sidebars of this kind.
4. **Province as a first-class dimension** — choropleth map, province pages, per-province counts (8, 3, 11) all missing; province exists only as a text filter.
5. **Taxonomies the schema doesn't have** — contact_type (3), institutional categories (4), partner-contact-type (10), data categories (11), event types (13): designs assume classification axes the database/UI never implemented.
6. **Confirmation/process states** — Request-ID confirmation (10), How-It-Works steppers (7, 12), numbered step badges (10): the app ends flows with a toast.
7. **Real data where the app is mocked** — contact-points institutions (4), province aggregates (8), market KPIs/charts (11).
8. **Missing tiers/fields in the commercial model** — USD 250 "Verified Company" tier (6, 12), DRC legal-identity fields RCCM/NIF (6), comparison matrix (12).

---

## 4. Already close to the designs

- **`/request` (design 10, 55)** — the strongest page: hero, 8 selectable need cards, dense 2-col form, and privacy line all exist. Remaining work is field parity, upload, the Request-ID confirmation, and restyling.
- **`/pricing` (design 12, 42)** — the $3,000 premium offering is functionally complete (plans, request flow, benefits); the gap is almost purely visual plus one missing tier.
- **`/register` (design 6, 40)** — wizard and pricing bones exist; needs the marketing shell, DRC legal fields, and tier handoff.
- **Data plumbing generally** — keyword/sector/province filtering, verified-only listings, tier badges, mediated messaging, and live sector counts all exist under the hood (2, 7, 9, 3). Much of the debt is **presentation-layer**: rearranging existing data into the designs' hero/card/sidebar structures and adopting the navy-red-yellow system, not building new backends.
- **How It Works / Who We Serve content (our-services)** — already implemented almost 1:1 inside `/request`; needs a public route and catalog around it.

**Recommended attack order:** (a) establish the shared DRC design system (palette tokens, hero component, faceted search bar, card variants, sidebar lead form) once — it unblocks 14 pages simultaneously; (b) build the three missing pages (by-province, local-contacts landing, services); (c) rebuild the three weakest hubs (data-hub, events, contact-points); (d) finish field/state parity on the near-complete flows (request, pricing, register).

---

## 5. Build log & next up (one-by-one)

We're building the designs one at a time, using the homepage as the pattern-setter.

- **Done so far:**
  - 🟡 Design 1 — Homepage (`/`). Established the reusable DRC design system: `--color-market-*` tokens, navy navbar/footer, faceted search, dense card grids, anonymous lead-rail form, `provinces.ts`.
  - 🟡 Design 2 — Opportunities (`/opportunities`). Photo hero + 4-field search, live stats, tabbed board over real published opportunities joined to their company (verified tick + type badges), Post-Opportunity + Submit-Business-Need (→ `business_requests`) + Why-Use rail. Added `listBoardOpportunities` query, `board-config.ts` (tab↔category map + badge/icon), and seeded 16 opportunities (24 published total).

- **Next up — recommended: Design 7 — Verified Companies Directory (`/companies` + `/trust`)** or **Design 9 — Explore by Sector (`/sectors`).** Both reuse the same hero + dense card-grid language we've now built twice; backends (verified listings, sector counts) already exist, so mostly presentation. Alternatively Design 5 — Company Profile (`/companies/[id]`) to complete the companies funnel end-to-end.

- **Alternatives if you'd rather prioritize differently:**
  - **Biggest visible gap →** Design 8 (Explore by Province, score 12) or Design 11 (Data Hub, 15): whole new pages, higher effort (map/charts + a province/KPI data layer).
  - **Nearest to done →** Design 10 (Request, 55) or Design 12 (Pricing, 42): mostly restyle + field/state parity.
  - **Reuse the marketplace pattern →** Design 7 (Verified Directory) or Design 9 (Explore by Sector): same hero + card-grid language as the homepage.
