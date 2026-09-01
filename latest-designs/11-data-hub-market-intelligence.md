# Data Hub / Market Intelligence Dashboard (source: 11.ai)

## 1. Page identification & purpose

This is the **"Trade in DRC Data Hub"** page — a public-facing **market intelligence / data dashboard** landing page. The H1 reads *"Explore the Trade in DRC Data Hub"* with a subtitle promising "market intelligence, sector data, business insights, trade information and strategic indicators for the Democratic Republic of Congo."

Role in the site: it is the "Market Intelligence" nav destination (the nav shows a "Market intelligence" item and a highlighted "Request Market Insight" outline button). Intent: position TradeInDRC as an authoritative data source — a Bloomberg-lite for DRC trade — combining live-looking KPI stats, charts, a downloadable reports library, category browse tiles, and a lead-capture form ("Request Custom Market Intelligence"). It is simultaneously a marketing surface (impressive charts, big numbers) and a functional data portal.

## 2. Layout & grid

Single desktop artboard, roughly 1170 px wide, light-gray page background (#F2F4F7) with white cards. Overall structure: dark navy header band → hero with photo → two-column body (main dashboard ~72% left, sticky sidebar ~28% right) → full-width dark footer.

Section order top-to-bottom:
1. **Top utility bar** (dark navy): logo left, "Power by BrandsBridge Group" right.
2. **Nav bar** (white): 9 links + red filled CTA "Register Your Company" + yellow-outlined CTA "Request Market Insight".
3. **Hero** (~200 px tall): dark navy/photo composite — dashboard-screens imagery left, Kinshasa cityscape right with a yellow-outlined DRC map silhouette containing white bar-chart glyphs. H1 + subtitle left-aligned.
4. **Filter/search bar** overlapping the hero bottom edge (white card): 4 labeled dropdowns — Sector / Province / Data Type / Time Range — plus red "Search Data" button.
5. **Stats strip**: 4 white pill-cards (left column): 1,200+ Companies Mapped · 26 Provinces Covered · 18 Strategic Sectors · 350+ Reports & Datasets, each with a navy circular icon.
6. **Market Overview Dashboard** card: 4 KPI tiles (Total Trade Value $24.8B ▲15.6%, Exports $15.7B ▲12.4%, Imports $9.1B ▲18.3%, Active Companies 1,200+ ▲9.2%) then a 4-up chart row: line chart (Trade Value Trend), horizontal bar chart (Sector Activity), donut chart (Companies by Sector), choropleth DRC map (Provincial Coverage).
7. **Latest Reports & Datasets**: data table, 6 rows × columns (Report/Dataset, Category, Coverage, Published, Type) with two action buttons per row ("View Report" outline, "Download Summary" red-outline with icon). "View All Reports →" link top-right.
8. **Browse by Data Category**: 6 equal tiles in one row — Sector Reports, Company Directory Data, Provincial Profiles, Trade Flows, Investment Opportunities, Market Signals — each icon + title + 2-line description + arrow.
9. **Right sidebar** (parallel to 5–8): "Request Custom Market Intelligence" form card; "Why Use the Trade in DRC Data Hub?" checklist card (6 items); two stacked promo cards — "For Investors" (navy) and "For Businesses" (red) with white outline buttons.
10. **Footer** (dark navy): 5 columns — brand + tagline + social icons, Quick Links, Resources, Company, Contact Us.

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

Density is high — dashboard-grade, minimal whitespace between cards (~16–20 px gutters), consistent with the customer's "compact, info-dense" feedback. Everything left-aligned inside cards.

## 3. Color palette

DRC flag logic: sky blue/navy + red + yellow, executed as a corporate navy-dominant scheme.

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#0B1E4B` / `#0D2257` | Utility bar, hero base, footer, "For Investors" card, stat icons circles, primary headings |
| Brand red | `#C8102E` (≈`#BE1E2D`) | All primary CTAs (Register Your Company, Search Data, Submit Request), "For Businesses" card, download buttons, chart "Imports" series, donut segment |
| DRC yellow | `#F7C600` | "Request Market Insight" outline button, DRC map outline in hero, small accents |
| Page gray | `#F2F4F7` | Body background |
| White | `#FFFFFF` | Nav, all cards, footer text |
| Medium blue | `#2E5FAC` / `#4472C4` | Chart bars, choropleth "High" fill, links, donut segment |
| Light blues | `#8FAADC`, `#C9D7EE` | Choropleth Medium/Low, chart fills |
| Green | `#1E9E4E` | ▲ positive delta indicators, Exports icon |
| Teal/green/orange | `#2BA58C`, `#E88A2D` | Donut/bar category series (Agriculture, Energy…) |
| Text dark | `#1A1F2E` | Body copy |
| Text muted | `#6B7280` | Labels, "vs. previous 12 months", table meta |
| Border gray | `#E3E6EB` | Card strokes, table row dividers, input borders |

## 4. Typography

- Single geometric/humanist **sans-serif** family throughout (reads like Poppins/Montserrat-adjacent — rounded geometric forms; site can map to its existing sans).
- H1 "Explore the Trade in DRC Data Hub": ~34–38 px, SemiBold, white, sentence case.
- Card section titles ("Market Overview Dashboard", "Latest Reports & Datasets", "Browse by Data Category"): ~15–16 px Bold, navy, title case.
- KPI numbers ($24.8B, 1,200+): ~20–22 px Bold navy; stat-strip numbers ~18 px Bold.
- Labels/microcopy ("vs. previous 12 months", filter labels, table headers): ~9–10 px Regular/Medium, muted gray; table headers in ALL-CAPS.
- Nav links: ~12 px Medium, dark navy, title case.
- Buttons: ~11–12 px SemiBold; footer column headers Bold white ~13 px.
- Tight line-height overall (~1.2–1.35), no letterspacing games except the caps table header.

## 5. Components

- **Utility bar**: full-width navy strip, logo (DRC-map mark + "Trade in DRC / Connect – Invest – Grow" with the tagline words colored blue–red–green), right-aligned "Power by" + BrandsBridge logo.
- **Nav bar**: white, single row, text links; red filled button (radius ~6 px) + yellow 2 px-outline pill-ish button (radius ~8 px) on dark chip.
- **Hero**: photo composite with navy multiply overlay; yellow-stroked DRC silhouette as a container for white bar-chart bars (data-nation motif).
- **Filter bar**: white rounded card (~10 px radius, soft shadow), 4 select inputs with tiny top labels, chevrons, 1 px gray borders, ~6 px radius; red search button with magnifier icon.
- **Stat pill-cards**: white, ~12 px radius, navy filled circular icon (~44 px) left, number + label right.
- **KPI tiles**: white, thin border, ~10 px radius; small tinted circular icon (yellow $, green export, red import, blue users), label, big value, green ▲ delta, muted comparison text.
- **Charts**: line (2 series, exports navy dots / imports red), horizontal bars with value labels ($10.8B, $4.2B, $3.6B, $2.6B, $1.9B), donut with center label "1,200+ Companies" + right legend with %, choropleth DRC map + High/Medium/Low legend. All inside bordered white sub-cards with tiny bold titles.
- **Reports table**: caps header row, file-type icon per row (red doc glyph), zebra-free with hairline dividers; per row two small buttons — "View Report" (gray outline) and "Download Summary" (red outline, download icon), both ~4–6 px radius.
- **Category tiles**: 6-up, white, centered-icon top-left, title bold, 2-line gray description, "→" arrow bottom; navy line-style icons.
- **Form card**: title with red envelope icon; inputs Full Name*, Company*, Sector of Interest* (select), Email Address*, textarea "Tell us what insights you need..."; full-width red "Submit Request" button.
- **Checklist card**: 6 rows of navy circular badge icons + one-line benefits.
- **Promo duo**: two stacked color-block cards (navy / red), white heading + small copy + white-outline button ("Explore Investor Data →", "Explore Business Data →").
- **Footer**: navy; brand block with tagline paragraph, 4 circular-outline social icons (LinkedIn, Facebook, X, YouTube); 3 link columns separated by thin vertical divider lines; Contact Us column with line icons (pin, mail, phone, globe): address, email, phone, URL.

## 6. Borders, radii, shadows & effects

- Radius system: cards ~10–12 px; buttons/inputs ~5–6 px; icon circles fully round. No sharp-corner elements outside the hero.
- Strokes: 1 px `#E3E6EB` on nearly every card and input; 2 px yellow outline on the special nav CTA and the hero DRC map.
- Shadows: very soft, low-elevation (`0 1px 3px rgba(16,24,40,.06)` feel) — flat dashboard aesthetic, no heavy drops.
- Hero uses a photo + navy gradient/multiply overlay; left edge blends dashboard-UI imagery at low opacity. No glassmorphism.
- Vertical hairline dividers between footer columns and between stat cards.

## 7. Imagery & iconography

- **Hero photo**: Kinshasa/Congo-river cityscape at right, blue-toned with navy overlay; left side layered screenshots of analytics dashboards at reduced opacity; yellow DRC map outline filled with abstract white bar-chart columns — the page's signature motif.
- **Choropleth**: simplified DRC province map, 3-step blue scale.
- **Icons**: consistent line-style (≈1.5–2 px stroke) in navy/white — building, people, clock, document, dollar, arrows up/down, pin, bell, envelope, check-circles. Filled circular containers for stats/checklist; bare line icons in category tiles and footer contact.
- Social icons: outline circles with glyphs.

## 8. Content & copy

Language: **English only** on this artboard (site is EN/FR — FR translation needed).

Key strings (verbatim):
- H1: "Explore the Trade in DRC Data Hub"; sub: "Access market intelligence, sector data, business insights, trade information and strategic indicators for the Democratic Republic of Congo."
- Nav: Home · Companies · Opportunities · Marketplace · Local Contacts · Market intelligence · Promote Your Business · Contact · Register Your Company · Request Market insight
- Filters: Sector "All Sectors" / Province "All Provinces" / Data Type "All Data Types" / Time Range "Last 12 Months" / "Search Data"
- Stats: "1,200+ Companies Mapped", "26 Provinces Covered", "18 Strategic Sectors", "350+ Reports & Datasets"
- KPIs: "Total Trade Value (USD) $24.8B ▲15.6%", "Exports (USD) $15.7B ▲12.4%", "Imports (USD) $9.1B ▲18.3%", "Active Companies 1,200+ ▲9.2%", each "vs. previous 12 months"
- Chart titles: "Trade Value Trend (USD)", "Sector Activity (Trade Value in USD)", "Companies by Sector", "Provincial Coverage"; sectors: Mining, Agriculture, Energy, Manufacturing, Construction, Transport & Logistics, Other
- Table rows: "Mining Sector Snapshot – Q1 2024", "Agriculture Trade Outlook 2024", "Provincial Investment Climate Index", "Energy Market Brief – DRC", "Logistics Corridor Overview" (categories Mining/Agriculture/Investment/Energy/Transport & Logistics; coverage National/26 Provinces/Regional; dates May 8 2024 → Apr 10 2024; types Report/Dataset)
- Categories: Sector Reports · Company Directory Data · Provincial Profiles · Trade Flows · Investment Opportunities · Market Signals
- Sidebar: "Request Custom Market Intelligence" form; "Why Use the Trade in DRC Data Hub?" — "Verified market information from trusted sources", "In-depth insights on strategic sectors", "Province-level data for targeted decisions", "Support for business discovery and partnerships", "Investor-ready intelligence and reports", "Data-driven decision support for growth"
- Promos: "For Investors — Access investor-grade data and market intelligence to make confident decisions. Explore Investor Data →"; "For Businesses — Find market insights, partners, and opportunities to grow your business. Explore Business Data →"
- Footer contact: "31, Avenue de la Justice, Gombe, Kinshasa, Democratic Republic of Congo" · info@tradeindrc.com · +243 81 234 5678 · www.tradeindrc.com
- Copy nits: "Power by" should be "Powered by"; inconsistent casing "Market intelligence" / "Request Market insight".

Tone: authoritative, investor/government-facing, data-first.

## 9. UX assessment

**Works:**
- Clear F-pattern hierarchy: hero promise → filters → proof stats → dashboard → downloadable assets → lead capture. Strong scanability from consistent card titling.
- Dual-CTA strategy is coherent: red = act (search/submit/register), yellow = the special "Request Market Insight" pathway.
- Sidebar lead form sits beside the dashboard — good conversion placement for a B2B data product.
- The DRC-map-with-bars hero motif is memorable and on-brand.

**Risky:**
- 4 charts in one row at ~72% column width → each chart ~200 px wide; donut legend and map legend will be cramped; on tablet this must reflow 2×2, on mobile stack.
- Micro-typography (9–10 px labels, table headers) is below comfortable web minimums — bump to 12 px min.
- White text on brand red (`#C8102E`) passes AA only at bold/large; the small red-outline "Download Summary" text may fall under 4.5:1 — verify.
- Hero white subtitle over busy photo needs the overlay guaranteed ≥ ~55% opacity for contrast.
- Six category tiles in a single row is fragile; 3×2 grid below ~1280 px.
- Data freshness: static "2024" report dates and hard KPI numbers will rot — must be CMS/DB-driven with a "last updated" stamp.
- Filter bar implies a query engine (sector × province × data type × time) — significant backend scope hiding in one component.

## 10. Mapping to TradeInDRC site

**Route:** new `src/app/[locale]/data-hub/page.tsx` (or `market-intelligence`), linked from the nav "Market intelligence" item in `NAVIGATION_CONFIG` (`src/config/navigation.ts`). Footer "Data Hub" quick link confirms it's a first-class route.

Implementation notes (Tailwind v4 / shadcn / existing stack):
- **Nav/CTAs**: extend Navbar with secondary yellow-outline CTA variant; red primary already matches brand-color CTA feedback.
- **Filter bar**: shadcn `Select` ×4 + `Button`; drive with URL search params; back it with a Supabase query over `sectors`, `companies`, and a new `reports`/`datasets` table + `provinces` reference table.
- **Stats + KPIs**: reuse/extend existing stats-card components; aggregate counts should come from cheap precomputed views (per COST_AWARE_DATA_READS — don't fan-out count queries per load).
- **Charts**: Recharts (line, horizontal bar, donut). Choropleth: inline DRC provinces SVG with class-based fills — avoid a mapping lib (open-source constraint is fine either way, but SVG is lighter).
- **Reports table**: shadcn `Table` + new `reports` table (title_en/title_fr, category → sectors FK, coverage, published_at, type, file_url in Supabase Storage, RLS public-read); "View All Reports" → `/data-hub/reports`.
- **Category tiles**: 6 `Link` cards, `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`.
- **Request form**: mirrors the existing request page pattern (migration 00022) — new `market_insight_requests` table or reuse requests with a type discriminator; Sonner toast on submit (NON_BLOCKING_UX).
- **Promo cards**: link to `/opportunities` (investors) and `/companies` or premium packages (businesses).
- **i18n**: all strings into `src/config/messages/{en,fr}.json`; artboard is EN-only, FR must be authored.
- **Motion**: per docs/MOTION.md — restrained; count-up on KPIs and chart draw-in ≤300 ms qualify as the marketing-surface mount recipe; no scroll-jacking.
- Sidebar: `lg:sticky lg:top-*` at ~28% width; below `lg` it stacks under the dashboard, form first.
