# Institutional Contacts Directory — design 4 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/4.pdf` (source artboard `4.ai`)
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/4-institutional-contacts-directory.md`
- App route: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/contact-points/page.tsx`
- App detail route: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/contact-points/[slug]/page.tsx`

## THE DESIGN SPEC

Single desktop artboard (~1170px). Top-to-bottom:

```
+--------------------------------------------------------------+
| [logo Trade in DRC]                    Power by BrandsBridge |  navy #0B2240
+--------------------------------------------------------------+
| Home Companies Opportunities ... Contact   (q)[Register][Req]|  white
+--------------------------------------------------------------+
| Home > Local Contacts Directory > *Institutional Contacts*   |  navy, current crumb orange
+--------------------------------------------------------------+
| H1 Navigate the DRC Business          [ Search inst...    ]  |
| Environment ... Contacts              [ All Categories  v ]  |  white
| subtext (3 lines)                                            |
+--------------------------------------------------------------+
| +-----------+  +--------+ +--------+ +--------+              |
| |CATEGORIES |  | ANAPI  | | FEC    | | FPI    |              |
| | All Inst. |  +--------+ +--------+ +--------+              |  gray band #F5F6F8
| | 10 items  |  | ARSP   | | DGI    | | OCC    |              |
| +-----------+  +--------+ +--------+ +--------+              |
|                | (icon) Need help...? [Request Guidance →]|  |
+--------------------------------------------------------------+
| footer: logo+mission | Quick Links | Resources | Company | BB|  navy
| © 2024 ...    Trade in DRC – Connecting...   www.tradein...  |  darker navy
+--------------------------------------------------------------+
```

### 1. Utility top bar (dark navy `#0B2240`, ~50px)
Logo lockup: DRC map silhouette (flag blue/yellow/red) + "Trade in DRC" white + tricolor tagline "Connect – Invest – Grow" (blue/orange/green). Right: "Power by" + BrandsBridge Group pink/blue diamond mark.

### 2. Primary nav (white bar)
9 flat text links: Home, Companies, Opportunities, Marketplace, **Local Contacts**, Market intelligence, Promote Your Business, Contact. Magnifier icon + two fully-rounded pill CTAs: solid orange `#F5A623` "Register Your Company" (white text) and solid blue `#1B6BD6` "Request a Partner".

### 3. Breadcrumb bar (navy strip, ~34px)
`Home > Local Contacts Directory > Institutional Contacts` — white text, small **solid blue triangle** separators, current crumb in **orange semibold**.

### 4. Page header row (white band, ~130px)
- **H1** (navy, bold, ~28–30px, 2 lines): "Navigate the DRC Business Environment with the Right Institutional Contacts".
- Subtext (~11px gray, 3 lines): "Access essentiel orientation on public agencies, professional organizations chambres and other support structures relevant to investment and commercial activity in the DRC." (customer typos: "essentiel", "chambres").
- Right, top-aligned: **search input** (white, 1px border, ~8px radius, magnifier icon, placeholder "Search institution, agency, organization...", ~300×44px) + **"All Categories" dropdown** (bordered field, solid navy filled caret).

### 5. Directory body (light gray `#F5F6F8` band)
- **CATEGORIES sidebar** (~17% width): white card, 1px `#E3E6EA` border, ~8px radius. Header "CATEGORIES" (ALL-CAPS, letter-spaced). **10 rows**, each with a thin-line icon + label: All Institutions (active: bold blue text + 3px blue left accent bar + light-blue row tint), Investment Promotion, Business Registration, Chambers & Networks, Sector Regulators, Provincial Support, Export & Trade Support, Finance & Tax, Legal & Judicial, Education & Training.
- **3-column card grid** (2 rows × 3 = 6 institution cards, ~270×145px, ~16px gutters). Each **institution card**: white fill, 1px `#E3E6EA` border, ~10px radius, flat/no shadow:
  - Top row: **grayscale institution logo** (~70×36) + bold navy acronym title (ANAPI, FEC, FPI, ARSP, DGI, OCC)
  - **Colored category badge pill** (~4px radius, tinted bg + colored text): "Investment Promotion" green `#E7F5EC` (ANAPI, FPI); "Business Support" / "Regulation" purple `#EFEAF8` (FEC, ARSP); "Tax & Fiscal" / "Standards & Quality" amber `#FBF3DE` (DGI, OCC)
  - 2-line gray description (~10px), e.g. ANAPI: "Facilitates and promotes investment in the DRC through incentives and investor support services."
  - Pin icon + location "Kinshasa" (all six cards)
  - Blue link "View Contact Details →" (~10px semibold, arrow glyph, no underline)

### 6. Help banner (full grid width, aligned to cards not sidebar)
Light gray rounded card (~10px radius, 1px border). Left: rounded navy line-icon (building + person) + bold navy "Need help navigating the DRC business environment?" + gray "Our team can connect you with the right institution or support service." Right: **solid navy rectangular button** (~6px radius) "Request Guidance →" white text.

### 7. Footer (navy) + sub-footer (darker navy)
Logo + mission paragraph ("Trade in DRC is your gateway to verified local business contacts…"); 3 link columns (Quick Links / Resources / Company) with "Local Contacts" active in orange; BrandsBridge lockup + 4 circular outlined social icons (LinkedIn, Twitter, YouTube, Mail). Sub-footer: "© 2024 Trade in DRC. All rights reserved." / "Trade in DRC – Connecting international business with local opportunities." / "www.tradeindrc.com".

**Visual language**: flat design, DRC-flag-derived palette (navy `#0B2240` + brand blue `#1B6BD6` + orange `#F5A623`, red confined to logo, green for "Grow"/positive badges), 1px light `#E3E6EA` borders everywhere, section rhythm from navy/white/gray banding, thin line icons, rounded geometric sans (Poppins/Jost-like). No photography, no gradients, no shadows.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Navy utility bar + BrandsBridge lockup | `#0B2240` strip, logo, "Power by" | ❌ | — | App has a single combined global navbar; no navy utility strip or BrandsBridge branding |
| Nav pills "Register Your Company" / "Request a Partner" | Orange + blue fully-rounded pills | ❌ | — | No dual orange/blue pill CTAs in the app's nav on this page |
| Breadcrumb bar (navy, orange current crumb) | `Home > Local Contacts Directory > Institutional Contacts` | ❌ | `contact-points/page.tsx` | No breadcrumb at all; page starts with PageHeader |
| H1 "Navigate the DRC Business Environment…" | Navy bold 2-line marketing headline | 🟡 | `page.tsx:173` (`PageHeader title`) | Generic i18n page title, not the design's marketing headline copy/treatment |
| Subtext paragraph | ~11px gray, 3 lines | 🟡 | `page.tsx:174` | Present as a muted `t("description")` paragraph |
| Search input "Search institution, agency, organization..." | Bordered field, magnifier, ~300×44 | ❌ | — | No search on the page at all |
| "All Categories" dropdown | Bordered select, navy caret | ❌ | — | No category dropdown; no category concept in the data model |
| CATEGORIES sidebar (10 thematic filters, icons, blue active accent) | White card, icon rows, 3px blue left bar | 🟡 | `page.tsx:177-199` | Sidebar exists but filters by **31 DRC cities**, not the 10 institutional categories; no icons, no left accent bar (uses `bg-primary/10` tint), rounded-2xl vs ~8px |
| 3-column institution card grid (6 cards) | Compact ~270×145 cards, gray band behind | 🟡 | `page.tsx:210-215` | Cards render as a **single-column stacked list** inside a white panel, not a 3-col grid on a gray band |
| Institution logo (grayscale, ~70×36) | Real agency logos, monochrome | ❌ | — | Cards have no logo/image at all |
| Acronym title (ANAPI, FEC…) | ~15px bold navy | 🟡 | `ContactPointCard`, `page.tsx:132` | Full long names ("Federation of Enterprises of the Congo (FEC)"), not acronym-led lockups |
| Category badge pills (green/purple/amber tints) | ~4px radius tinted pills | ❌ | — | No badges of any kind on cards |
| 2-line description | ~10px gray, clamped | 🟡 | `page.tsx:133` | Present but 3–4 line unclamped paragraphs — much denser than design |
| Pin + "Kinshasa" location line | ~9px gray + pin icon | 🟡 | `page.tsx:146-149` | Full street address with pin icon (more detail than design's city-only) |
| "View Contact Details →" card link | Blue semibold link + arrow | ❌ | (`[slug]/page.tsx` exists but unlinked) | Cards show inline website/phone/email instead of a details link; the detail route is not reachable from these cards |
| Help banner "Need help navigating…?" + "Request Guidance →" | Gray card, navy button | ❌ | — | Entirely absent (the app's existing `/request` page is the natural CTA target) |
| Gray body band `#F5F6F8` vs white cards | Section banding | 🟡 | `page.tsx:171` (`bg-muted/30`) | App wraps sidebar + list in white rounded-2xl panels on a faint muted page; band contrast far weaker than design |
| Navy footer + sub-footer, BrandsBridge, socials | 3 link columns, orange active link | 🟡 | global `Footer` (layout) | Site has its own global footer; columns/BrandsBridge/socials do not match the design's exact chrome (shared concern across all design pages) |
| Result count / empty state | (not in design) | ✅ | `page.tsx:205-224` | App-only additions: "N contacts" counter and dashed empty-state card |

## ❌ Design elements the app lacks entirely

**Filtering & discovery**
- Search input ("Search institution, agency, organization...") — implies client filter or Supabase text search over an `institutions` table.
- "All Categories" dropdown + the 10-category taxonomy (Investment Promotion, Business Registration, Chambers & Networks, Sector Regulators, Provincial Support, Export & Trade Support, Finance & Tax, Legal & Judicial, Education & Training) — implies a category enum column; current data has no category field.

**Card identity**
- Institution logos (grayscale, fixed box) — implies `logo_url` per institution (storage bucket or asset set).
- Colored category badge pills (green/purple/amber tint system) — depends on the category taxonomy above.
- "View Contact Details →" links wiring list cards into the existing `[slug]` detail route.

**Conversion**
- Help banner "Need help navigating the DRC business environment?" with navy "Request Guidance →" button — front-end only; maps onto the already-built `/request` feature.

**Chrome & data**
- Breadcrumb bar (navy, orange current crumb).
- Real data: the page runs on hardcoded `mockContactPoints` (only Butembo + Kinshasa populated; the other 29 cities show the empty state) — every element above presumes a Supabase `institutions` table (bilingual descriptions, RLS public-read) that does not exist.

## 🎨 Visual-language delta

- **Banding vs paneling**: the design carries hierarchy with full-bleed color bands (navy → white header → `#F5F6F8` body); the app floats white `rounded-2xl` panels on a near-white `bg-muted/30` page — flatter rhythm, zero navy on-page.
- **Grid vs list**: design is a compact 3-column grid of ~145px cards with 2-line clamped copy; the app is a single-column stack of tall text-heavy cards (4 contact rows each) — roughly 3× the vertical footprint per institution.
- **Color**: the design's navy `#0B2240` / orange `#F5A623` / tinted badge trio is absent; the app uses generic `text-primary` blue and slate grays only.
- **Iconography**: design gives every sidebar category a thin line icon; app sidebar rows are plain text buttons.
- **Radii**: app panels use `rounded-2xl` (16px) vs the design's tighter 8–10px; app cards (`rounded-xl`) are close.
- **Imagery**: both are photo-free, but the design's grayscale agency logos (its only imagery) are missing, so app cards read as anonymous text blocks.

## 🔷 App features the design omits

- Per-city browsing across 31 DRC cities (design filters by institutional category only; location is a plain label).
- Inline contact details on the card: clickable website, phone, mailto email, full street address (design defers all of this to the detail page).
- Result count ("N contacts") and a designed empty state (dashed card with pin icon and message).
- Existing detail route `contact-points/[slug]` — implied by the design's "View Contact Details" but not shown on the artboard.

## Verdict

**matchScore: 30**

The app has the right skeleton — a directory page with a left sidebar and contact cards over DRC institutions — but almost every element the design specifies is missing or organized differently. The sidebar filters by city instead of the design's 10 institutional categories, and there is no search, no category dropdown, no logos, no colored badges, no "View Contact Details" links, and no "Request Guidance" help banner. Visually the app shares none of the design's language: no navy/gray banding, no breadcrumb, single-column tall cards instead of a compact 3-column grid, and generic theme colors instead of navy/orange/badge tints. The page also runs entirely on hardcoded mock data, so the category taxonomy and institution records the design presumes do not exist in the backend. Treating the design as spec, this is an early placeholder needing a near-complete rebuild of the listing surface plus a small `institutions` data model.
