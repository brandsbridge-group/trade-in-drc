# Data Hub / Market Intelligence — design 11 vs current app

## Sources

- **Design PDF**: `/private/tmp/claude-501/.../scratchpad/designs/11.pdf` (single desktop artboard, "Explore the Trade in DRC Data Hub")
- **Design analysis**: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/11-data-hub-market-intelligence.md`
- **App route(s)**:
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/data-hub/page.tsx` (hub landing — the direct counterpart)
  - `src/app/[locale]/data-hub/reports/[kind]/page.tsx`, `.../reports/[kind]/[slug]/page.tsx`
  - `src/app/[locale]/data-hub/prices/page.tsx`, `.../prices/[seriesId]/page.tsx`
- **Key components**: `src/components/data-hub/report-card.tsx`, `src/components/data-hub/price-chart.tsx`, `src/lib/data-hub/queries.ts`, `src/components/design` (PageHeader, ListPageShell, FilterSidebar, EmptyState)

## THE DESIGN SPEC

A dense, dashboard-grade market-intelligence landing page on light-gray `#F2F4F7` with white bordered cards, navy `#0B1E4B` / red `#C8102E` / yellow `#F7C600` brand system. Two-column body: main dashboard ~72% left, sticky sidebar ~28% right.

```
┌────────────────────────────────────────────────────────────┐
│ NAVY UTILITY BAR   logo | Power by BrandsBridge            │
│ WHITE NAV  9 links      [Register ▮red] [Request ▢yellow]  │
├────────────────────────────────────────────────────────────┤
│ HERO (navy + photo + yellow DRC map)  H1 + subtitle        │
│   ┌─────[ Sector ▾ | Province ▾ | Type ▾ | Range ▾ |🔍]──┐ │
├───┴──────────────────────────────────────┬────────────────┤
│ [stat][stat][stat][stat]                 │ Request Custom │
│ ┌─ Market Overview Dashboard ──────────┐ │ Market Intel   │
│ │ KPI KPI KPI KPI                      │ │ (form, red CTA)│
│ │ line | bars | donut | map            │ ├────────────────┤
│ └──────────────────────────────────────┘ │ Why Use…       │
│ ┌─ Latest Reports & Datasets (table) ──┐ │ ✔ ×6 checklist │
│ └──────────────────────────────────────┘ ├────────────────┤
│ [cat][cat][cat][cat][cat][cat]           │ ForInvest│ForBiz│
├──────────────────────────────────────────┴────────────────┤
│ FOOTER: brand | Quick Links | Resources | Company | Contact│
└────────────────────────────────────────────────────────────┘
```

### 1. Hero band (~200 px, navy + photo composite)
- H1 white SemiBold ~36 px: **"Explore the Trade in DRC Data Hub"**; subtitle: *"Access market intelligence, sector data, business insights, trade information and strategic indicators for the Democratic Republic of Congo."*
- Right: Kinshasa cityscape photo, navy multiply overlay; **yellow-outlined DRC map silhouette filled with white bar-chart columns** — the page's signature motif. Left edge: faded analytics-dashboard screenshots.

### 2. Filter/search bar (white card overlapping hero bottom)
- 4 labeled selects — **Sector** ("All Sectors"), **Province** ("All Provinces"), **Data Type** ("All Data Types"), **Time Range** ("Last 12 Months") — 1 px `#E3E6EB` borders, ~6 px radius, tiny top labels; red **"Search Data"** button with magnifier icon. Card radius ~10 px, soft shadow.

### 3. Stats strip — 4 white pill-cards
- Navy filled circular icon (~44 px) + bold number + label: **"1,200+ Companies Mapped"**, **"26 Provinces Covered"**, **"18 Strategic Sectors"**, **"350+ Reports & Datasets"**. ~12 px radius, hairline dividers between.

### 4. "Market Overview Dashboard" card
- **4 KPI tiles**: tinted circular icon (yellow $, green ↑, red ↓, blue 👥), label, big navy value + green ▲ delta, muted "vs. previous 12 months": *Total Trade Value (USD) $24.8B ▲15.6% · Exports $15.7B ▲12.4% · Imports $9.1B ▲18.3% · Active Companies 1,200+ ▲9.2%*.
- **4-up chart row**, each in a bordered white sub-card with tiny bold title:
  1. **"Trade Value Trend (USD)"** — 2-series line (Exports navy, Imports red), monthly x-axis May 23→May 24.
  2. **"Sector Activity (Trade Value in USD)"** — horizontal bars with value labels ($10.8B Mining, $4.2B Agriculture, $3.6B Energy, $2.6B Manufacturing, $1.9B Construction, $1.5B Transport & Logistics).
  3. **"Companies by Sector"** — donut, center "1,200+ Companies", legend with % (Mining 28%, Agriculture 20%, Energy 15%, Manufacturing 12%, Construction 10%, Transport & Logistics 8%, Other 7%).
  4. **"Provincial Coverage"** — choropleth DRC province map, 3-step blue scale + High/Medium/Low legend.

### 5. "Latest Reports & Datasets" table
- Caps header row: REPORT/DATASET · CATEGORY · COVERAGE · PUBLISHED · TYPE. 5–6 rows with red doc-glyph icons: *"Mining Sector Snapshot – Q1 2024"*, *"Agriculture Trade Outlook 2024"*, *"Provincial Investment Climate Index"*, *"Energy Market Brief – DRC"*, *"Logistics Corridor Overview"*; coverage National / 26 Provinces / Regional; types Report/Dataset.
- Per row: **"View Report"** (gray outline) + **"Download Summary"** (red outline, download icon). **"View All Reports →"** link top-right.

### 6. "Browse by Data Category" — 6 tiles in one row
- Navy line icon + bold title + 2-line gray description + "→": **Sector Reports · Company Directory Data · Provincial Profiles · Trade Flows · Investment Opportunities · Market Signals**.

### 7. Right sidebar (sticky, ~28%)
- **"Request Custom Market Intelligence"** form card (red envelope icon): Full Name*, Company*, Sector of Interest* (select), Email Address*, textarea "Tell us what insights you need…", full-width red **"Submit Request"**.
- **"Why Use the Trade in DRC Data Hub?"** — 6 checklist rows with navy circular badge icons: verified market information · in-depth strategic sector insights · province-level data · business discovery support · investor-ready intelligence · data-driven decision support.
- **Promo duo**: navy **"For Investors"** card ("Explore Investor Data →") and red **"For Businesses"** card ("Explore Business Data →"), white outline buttons.

### 8. Chrome (site-wide in design)
- Navy utility bar with "Power by BrandsBridge Group"; white nav with red "Register Your Company" + yellow-outline "Request Market insight"; 5-column navy footer with social icons and contact block.

Visual system: radii 10–12 px cards / 5–6 px controls, 1 px `#E3E6EB` strokes everywhere, very soft shadows (`0 1px 3px rgba(16,24,40,.06)`), tight typography (labels 9–10 px, KPI numbers ~20–22 px bold navy), left-aligned dense layout.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Hero band w/ photo + yellow DRC-map motif | Navy photo composite, white H1 | ❌ | — | App uses plain `PageHeader` text on white; no hero, no imagery |
| H1 "Explore the Trade in DRC Data Hub" + subtitle | White ~36 px SemiBold | 🟡 | `data-hub/page.tsx` (`t("page.title")` = "Data Hub") | Exists as small plain heading "Data Hub"; different copy, no hero treatment |
| Filter bar (Sector/Province/Data Type/Time Range + Search Data) | White card, 4 selects, red button | ❌ | — | Hub page has no filters at all; sub-pages have a sector-only `SectorsFilter` sidebar (🟡 at best, different pattern/placement) |
| Stats strip (4 pill-cards: 1,200+ / 26 / 18 / 350+) | Navy circle icons, bold counts | ❌ | — | No aggregate stat counts anywhere in data-hub |
| KPI tiles ×4 (Trade Value / Exports / Imports / Active Companies w/ ▲ deltas) | Tinted icons, big navy value, green delta | ❌ | — | No KPI tiles; no trade-value data model exists |
| "Trade Value Trend" 2-series line chart | Exports navy / Imports red | 🟡 | `src/components/data-hub/price-chart.tsx` (used on `/data-hub/prices/[seriesId]`) | A single-series commodity price line (blue `#2563eb`), on a detail page — not trade exports/imports, not on the hub |
| "Sector Activity" horizontal bar chart | Navy bars w/ $ labels | ❌ | — | Not present |
| "Companies by Sector" donut + legend | Center "1,200+ Companies", 7 segments | ❌ | — | Not present |
| "Provincial Coverage" choropleth DRC map | 3-step blue scale + legend | ❌ | — | Not present; no provinces data model in data-hub |
| Latest Reports & Datasets table (5 cols, caps headers) | Hairline dividers, doc icons | 🟡 | `reports/[kind]/page.tsx` + `report-card.tsx` | Reports exist (Supabase `reports` table, published/kind) but rendered as stacked link-cards (title/summary/date), no table, no category/coverage/type columns |
| "View Report" / "Download Summary" buttons per row | Gray outline / red outline + icon | 🟡 | `reports/[kind]/[slug]/page.tsx` (attachment URL field exists in schema) | View = card click-through to detail page; no per-row download button styled per design |
| "View All Reports →" link | Top-right text link | 🟡 | Hub pillar tiles link to per-kind lists | Different mechanic (4 pillar tiles vs one link + unified table) |
| Browse by Data Category — 6 tiles | Icon + title + desc + → | 🟡 | `data-hub/page.tsx` pillar grid | App has **4** tiles (Market reports, Legal guides, Regulations, Price trends) in a 2-col grid; design has **6 different categories** in one row; app tiles are minimal (tiny icon, xs text), no arrow |
| "Request Custom Market Intelligence" form | Sidebar card, 5 fields, red Submit | ❌ | — | No lead-capture form on data-hub (a general request page exists elsewhere, not linked/embedded here) |
| "Why Use the Data Hub?" checklist ×6 | Navy circle check icons | ❌ | — | Not present |
| "For Investors" / "For Businesses" promo cards | Navy + red color blocks, white outline CTAs | ❌ | — | Not present |
| Sticky two-column layout (72/28) | Dashboard + sidebar | ❌ | — | Hub page is a single centered `max-w-5xl` column |
| Navy/red/yellow visual system on this page | `#0B1E4B`/`#C8102E`/`#F7C600`, dense cards | 🟡 | Site-wide theme | App page is white/slate minimal (`border-slate-200 rounded-xl`), no navy card headers, no red CTAs, no yellow accents on this page |
| Dark navy footer w/ "Data Hub" quick link | 5 columns | 🟡 | Site `Footer` (global) | Footer exists site-wide; column/link structure differs from design (not judged in depth here) |

## ❌ Design elements the app lacks entirely

**Dashboard analytics block** (biggest gap)
- 4 KPI tiles with YoY deltas — implies trade-statistics data (total/exports/imports USD by year) in DB or CMS.
- Sector Activity bar chart — implies trade value per sector.
- Companies by Sector donut — derivable from existing `companies` + `sectors` tables (count aggregation).
- Provincial Coverage choropleth — implies a `provinces` reference table + per-province company/data counts + DRC provinces SVG.

**Query/lead surfaces**
- 4-facet filter bar (Sector × Province × Data Type × Time Range) — implies a unified search endpoint over reports/datasets.
- "Request Custom Market Intelligence" sidebar form — implies a `market_insight_requests` table (or type discriminator on existing requests, migration 00022 pattern).

**Trust & conversion**
- Stats strip (companies mapped / provinces / sectors / reports counts) — cheap precomputed aggregates.
- "Why Use" 6-item checklist — static i18n content only.
- For Investors / For Businesses promo duo — static, links to existing routes.

**Brand/hero**
- Hero photo composite with yellow DRC-map-with-bars motif — static asset work only.
- Unified "Latest Reports & Datasets" table with Category/Coverage/Type columns + Download Summary — implies extending `reports` schema (coverage, dataset type) beyond current `kind` enum.

## 🎨 Visual-language delta

The design is a **dense navy/red/yellow Bloomberg-lite dashboard**; the app's data-hub is a **sparse, monochrome utility page**. Concretely: the design fills the viewport with bordered white cards on `#F2F4F7`, navy filled icon circles, red CTAs, green delta arrows, and four charts above the fold; the app shows a small heading and four pale gray-bordered tiles with 12 px text and lots of empty white space — closer to a docs index than a data portal. The design's KPI typography (20–22 px bold navy numbers) and caps micro-labels have no counterpart. The app's sub-pages reuse the generic `ListPageShell` + left `FilterSidebar` pattern, whereas the design puts filters in a horizontal hero-overlap bar and the sidebar on the **right** as a conversion column. The only chart in the app (price line) is styled generically (dashed grid, single blue line) rather than the design's navy/red dual-series with branded palette.

## 🔷 App features the design omits (regression watch-list)

- **Legal guides** and **Regulations** pillars (report kinds `legal_guide`, `regulation`) — the design's table/categories don't cover them explicitly.
- **Commodity price series** pages (`/data-hub/prices`, `/data-hub/prices/[seriesId]` with 12-month line chart + CSV-backed data points) — design has no per-commodity price detail.
- Report **detail pages** with markdown body + attachment (`reports/[kind]/[slug]`) — design only shows View/Download buttons.
- Sector filtering with `ActiveFiltersBar` on list pages.
- Admin CMS for reports/price data (CSV upload, draft/published/archived workflow) — invisible in the design but load-bearing.
- Full FR (+TR/ZH/ES) i18n — design artboard is EN-only.

## Verdict

**matchScore: 15/100**

The app has a real, working Data Hub backbone — a published-reports CMS, price series with a Recharts line chart, and sector filters — but almost none of what the design actually shows on this page. The design is a market-intelligence dashboard: hero with the DRC-map motif, a 4-facet search bar, a stats strip, four KPI tiles, four charts (line, bars, donut, choropleth), a reports table with download actions, six category tiles, and a full conversion sidebar (custom-intelligence form, checklist, investor/business promos). Of roughly 18 distinct design elements, none are fully present, about 7 are partial (mostly because reports and one line chart exist in a different shape elsewhere in the route), and 11 are entirely missing. Visually, the app's minimal white/slate index page shares essentially nothing with the design's dense navy/red/yellow dashboard language. Adopting the design means new data models (trade statistics, provinces, insight requests) plus a full rebuild of the hub landing page, while preserving the app's existing report kinds and price-series pages the design doesn't account for.
