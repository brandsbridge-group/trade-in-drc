# Latest Designs — Index & Cross-Design Synthesis

14 Illustrator artboards (customer-supplied, BrandsBridge Group co-branded) analyzed into per-design markdown files in this folder. This index maps each source file to its site page, consolidates the shared design system, flags inconsistencies, and proposes an implementation grouping.

## 1. Matching table

| # | Source .ai | Site page (route) | Analysis md | One-line summary |
|---|---|---|---|---|
| 1 | `1.ai` | Marketplace Landing (`/marketplace` or redesigned `/`) | [1-marketplace-landing.md](1-marketplace-landing.md) | Search-forward marketplace landing: hero faceted search, 12 category chips, featured products, verified suppliers, buyer/seller banners, persistent right-rail buying-request form. |
| 2 | `2.ai` | Opportunities Board (`/opportunities`) | [2-opportunities-board.md](2-opportunities-board.md) | Dense opportunities listing: hero with overlapping 4-field search card, 9-row verified opportunity table with type badges, featured carousel, sector tiles, poster/seeker dual-CTA sidebar. |
| 3 | `3.ai` | Local Contacts Landing (`/local-contacts`) | [3-local-contacts-landing.md](3-local-contacts-landing.md) | "Find Trusted Local Business Contacts" landing: 4-field faceted hero search over Kinshasa skyline, contact-type and sector grids with live counts, Discover/Verify/Connect trust strip, navy CTA band. |
| 4 | `4.ai` | Institutional Contacts Directory (`/local-contacts/institutions`) | [4-institutional-contacts-directory.md](4-institutional-contacts-directory.md) | Flat directory of DRC public institutions (ANAPI, FEC, FPI, ARSP, DGI, OCC) with category sidebar, search + dropdown filters, badge-coded cards, "Request Guidance" banner. |
| 5 | `5.ai` | Company Profile (`/companies/[id]`) | [5-company-profile.md](5-company-profile.md) | Dense company detail page (step 3 of the Local Contacts funnel): identity hero, verification proof table, products/partnership cards, mediated contact-request form. |
| 6 | `6.ai` | Register Your Company (`/register-company`) | [6-register-local-business-contact.md](6-register-local-business-contact.md) | Supply-side registration: navy/gold hero, three pricing tiers (Free / USD 250 / USD 3,000-yr), 5-step registration stepper with all form sections previewed, benefit strip. |
| 7 | `7.ai` | Verified Companies Directory (`/companies?verified`) | [7-verified-companies-directory.md](7-verified-companies-directory.md) | Trust-centric verified directory: navy hero, 3-tier verification badge explainer, sector/province/type filter bar, 4-column company card grid, 5-step verification process strip. |
| 8 | `8.ai` | Local Contacts by Province (`/local-contacts/provinces`) | [8-local-contacts-by-province.md](8-local-contacts-by-province.md) | Province browse page: interactive DRC choropleth map with pins, ranked list of 7 key economic provinces with counts, monetizable "Featured Province" band (Lualaba) with lead-gen CTA. |
| 9 | `9.ai` | Companies by Sector (`/local-contacts/sectors` or `/sectors`) | [9-explore-companies-by-sector.md](9-explore-companies-by-sector.md) | Sector directory: 3x2 grid of six sector cards with company/verified-partner counts, featured Mining & Minerals module with sub-category mini-cards and "Request a Verified Mining Partner" CTA. |
| 10 | `10.ai` | Find a Local Partner — Request (`/request`) | [10-find-local-partner-request.md](10-find-local-partner-request.md) | 3-step matchmaking intake: navy hero, 8 need-type radio tiles, 13-field form with upload, green confirmation card with Request ID. |
| 11 | `11.ai` | Data Hub / Market Intelligence (`/data-hub`) | [11-data-hub-market-intelligence.md](11-data-hub-market-intelligence.md) | Market-intelligence dashboard: hero filter bar, KPI stats, 4-chart overview (line/bar/donut/choropleth), reports table, category tiles, sidebar lead-capture + investor/business promos. |
| 12 | `12.ai` | Premium Membership (`/premium`) | [12-premium-membership.md](12-premium-membership.md) | Conversion-focused Premium Local Partner sales page: floating 3-plan comparison table (USD 3,000/yr), 6-up benefits strip, checklist + 4-step How It Works, single red Apply CTA. |
| 13 | `13.ai` | Events (`/events`) | [13-events-page.md](13-events-page.md) | Business Events hub: photo hero with 5-field event search, featured/upcoming card carousels, sector tiles, organizer promo band, sidebar with event-submission form and newsletter. |
| 14 | `Our services.ai` | Our Services (`/services` — new route) | [our-services-services-page.md](our-services-services-page.md) | Services landing proposal: hero with DRC-flag map + photo collage, 7 numbered service cards (4+3 grid), embedded 9-field Request-a-Service form, 12 sector chips, 4-step How It Works. |

## 2. Cross-design synthesis

### 2.1 Consolidated color palette

Every design executes the same **DRC-flag logic**: navy carries structure/trust, red is rationed to conversion CTAs, yellow/gold marks premium and special actions. Per-artboard hex values drift (different designers/exports); consolidate to one token set:

| Token | Recommended hex | Observed range across designs | Usage |
|---|---|---|---|
| `navy` (primary dark) | `#0B2447` | #0B1F3A · #0B1F4B · #0A2A5C · #0B2240 · #102A43 · #0B2447 · #0D3057 · #0B1E4B · #0A1E5C · #0B2A5B · #0B1F60 · #002B7A | Navbars, heroes, footers, headings, stats bars |
| `brand-red` | `#D8232A` | #D8232A · #D6232A · #D22730 · #D62E2E · #C8102E · #E11B22 · #D6191F · #D22630 · #DC2626 · #D64545 | Primary conversion CTAs (Search, Submit, Register, Apply), "View All" links |
| `gold` | `#F5B800` | #F5B800 · #F5C518 · #F5A800 · #F5A623 · #F5B21A · #F5B700 · #F7C600 · #F5A81C · #F5A700 | Premium badges/CTAs, stat icons, featured accents, flag star |
| `link-blue` (secondary) | `#1D6FD8` | #1E6FD9 · #1B6BD6 · #1D6FD8 · #1B4FA0 · #1A73E8 · #2563EB · #1D4ED8 · #2E5FAC · #1B75BB · #4E7FD0 | Links, active tabs/steppers, info badges, chart series |
| `success-green` | `#1E9E4A` | #1DA84C · #3FA34D · #1E9E4A · #22A24C · #2E9E4F · #2E9E5B · #3D9B35 · #22A24B · #22A65B · #1E9E4E | Verified chips, positive deltas, confirmation states |
| `page-bg` | `#F4F6F8` | #F3F5F8 · #F4F6F9 · #F4F5F7 · #F4F6F8 · #F2F5F9 · #F0F3F7 · #F5F6F8 · #F7F8FA · #F2F4F7 · #EFF1F4 | Page canvas behind white cards |
| `border` | `#E3E6EA` | #E2E6EC · #E3E6EA · #D9E0E7 · #DDE1E8 · #E3E8EF · #D9DDE3 · #E3E6EB · #D1D5DB | 1px hairlines on all cards/inputs |
| `text-muted` | `#6B7280` | #6B7280 · #4B5563 · #4A5568 · #5B6B7C · #9CA3AF · #8A94A6 | Descriptions, labels, footer links |
| `cream` (accent bg) | `#FDF6E3` | #FDF6E3 · #FBF3DC · #FBF6EC · #FFF6DC | Seller banners, featured-province band, premium badge tints |
| `verified-blue` | `#1DA1F2` / `#2563EB` | — | Verified checkmark badges |

**Outlier:** `Our services.ai` uses **royal blue** (`#1E40AF`) as the CTA/action color instead of red — it is a separate "proposal" artboard with a simplified 6-link nav and its own footer. Reconcile before implementation (recommend: keep red CTAs, royal blue only if the customer insists for /services).

### 2.2 Typography

- One **geometric/neo-grotesque sans** family everywhere (reads Poppins/Montserrat/Manrope-like) — no serifs, no all-caps blocks (except occasional table headers).
- Scale (desktop equivalents): hero H1 ~34–38px bold; section titles ~15–20px bold, Title Case; card titles ~12–16px semibold; body ~11–14px regular gray; micro-labels 9–11px.
- **Systemic problem:** mockup body/microcopy sizes (9–11px) are below web minimums; bump to 12px min, body 14px, in implementation.
- Casing: Title Case headings/buttons/nav, sentence case body; red asterisks on required form labels.

### 2.3 Shared component language

- **Flat, light theme, high density** — white cards on very light gray, separation via 1px hairline borders and background tone shifts, not shadows (shadows, where present, are ~`0 1px 3px rgba(0,0,0,.06)`). No gradients on UI surfaces, no glassmorphism.
- **Radius system:** ~6–8px buttons/inputs/chips, ~8–12px cards, ~999px only on badges/pills. Consistent across all 14 designs (services page runs slightly larger, 12–16px).
- **Recurring patterns (build once, reuse):**
  - Navy navbar: logo + tricolor "Connect – Invest – Grow" tagline, 8 links, dual CTA (outline + red/gold filled)
  - Photo hero with navy multiply overlay + faceted 3–5-field search bar overlapping/embedded (designs 1, 2, 3, 7, 11, 13)
  - Navy stats strip with gold icons + big white counts
  - Card grid: photo/logo top, title + verified check, pin+location line, 2-line clamp, dual footer buttons (outline + red filled)
  - Right-rail lead-capture form card with navy header + red submit bar (designs 1, 11, 13; embedded variants in 5, 10, 14)
  - Verification semantics: green ✓ chips, 3-tier badge system, "Verified by Trade in DRC" tables
  - Numbered "How It Works" step strips (designs 6, 7, 10, 12, 14)
  - Navy footer: brand + 3–4 link columns + socials + gold "Upgrade to Premium" button; cream bottom tagline strip
  - "Power by BrandsBridge Group" co-brand (typo — fix to "Powered by"; confirm contractual requirement)

### 2.4 Inconsistencies to reconcile

1. **CTA color split:** red CTAs everywhere vs. royal-blue CTAs on the Services page; design 5 uses **gold** for its conversion buttons; design 6 mixes gold + blue. Define one rule: red = conversion, gold = premium/special, blue outline = secondary.
2. **Hex drift:** ~12 navies, ~10 reds, ~9 golds across artboards — must collapse to the token set above.
3. **Nav variants:** 8-link nav (most), 9-link (11), 6-link simplified (services); some artboards add a white utility bar above the navy nav (5, 11), others don't. Consolidate to one global header (likely mega-menu — 8+ links won't fit at laptop widths).
4. **Footer variants:** near-black 4-column (1), navy 3-column (5), navy 5-column (11), single-bar BrandsBridge footer (services). Keep one global footer.
5. **Copy quality:** recurring typos ("Power by", "Pratical"), inconsistent casing ("Market intelligence"), EN-only — all FR strings must be authored.
6. **Static data:** hardcoded counts/KPIs/dates throughout — must be DB-driven or removed; never fake counts.

## 3. Recommended reading order / implementation grouping

### Group A — System foundation (read first)
1. **1-marketplace-landing.md** — richest single expression of the design system (nav, hero search, stats, cards, form rail, footer); defines the homepage/marketplace direction.
2. **5-company-profile.md** — the densest inner "workhorse" page; defines card, badge, table, tab, and form conventions.

These two together yield ~90% of the shared tokens and components.

### Group B — Local Contacts funnel (one coherent 4-step journey; implement as a unit)
3. **3-local-contacts-landing.md** (step 1 — landing) → **7-verified-companies-directory.md** + **8-local-contacts-by-province.md** + **9-explore-companies-by-sector.md** + **4-institutional-contacts-directory.md** (step 2 — directory browse facets) → **5-company-profile.md** (step 3 — detail) → **10-find-local-partner-request.md** (step 4 — request intake).

### Group C — Content/listing hubs (each standalone, reuse Group A components)
4. **2-opportunities-board.md** (`/opportunities` redesign)
5. **13-events-page.md** (`/events` redesign)
6. **11-data-hub-market-intelligence.md** (`/data-hub` — largest backend scope: reports table, charts, filter engine)

### Group D — Monetization & supply side
7. **6-register-local-business-contact.md** (registration wizard + pricing tiers)
8. **12-premium-membership.md** (premium sales page — ties to existing $3,000/$3,600 packages)
9. **our-services-services-page.md** (`/services` — reconcile blue-CTA outlier + BrandsBridge footer question first)

**Homepage note:** none of the artboards is literally labeled "homepage." Design 1 (Marketplace Landing) is the closest match to the customer's stored "search-forward home" request — treat it as the homepage/marketplace hub decision point before building Group C/D pages that hang off its nav.
