# Opportunities Board — design 2 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/.../scratchpad/designs/2.pdf` (1 page, "Explore Business Opportunities in the DRC")
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/2-opportunities-board.md`
- App route: `src/app/[locale]/opportunities/page.tsx` (board) · `src/app/[locale]/opportunities/[category]/[slug]/page.tsx` (detail)
- Key components: `src/components/design/list-page-shell.tsx`, `src/components/design/opportunity-card-design.tsx`, `src/components/design/featured-opportunity-strip.tsx`, `src/components/design/page-header.tsx`, `src/components/design/filter-sidebar.tsx`, `src/components/opportunities/category-badge.tsx`, `src/components/opportunities/respond-dialog.tsx`, `src/lib/opportunities/queries.ts`, `src/lib/opportunities/categories.ts`

## THE DESIGN SPEC

Landscape desktop artboard (~1440 px). Branding: "Trade in DRC — Connect – invest – Grow", "Power by BrandsBridge Group". English-only copy. Institutional flat style built on the DRC flag triad: deep navy `#0B1F4B`, brand red `#D8232A`, yellow `#F5C518`, sky blue `#1E6FD9`, success green `#1DA84C`, page bg `#F3F5F8`.

```
+--------------------------------------------------------------------------+
| NAVY NAVBAR: logo | 9 links            [Register Company] [Post Opp (R)] |
+--------------------------------------------------------------------------+
| HERO photo + navy overlay:  H1 centered + subhead                        |
|   [ Keyword | Type v | Sector v | Province v | (Search R) ]  <- white bar|
|        [Browse Opportunities (R)]  [Submit Opportunity (outline)]        |
+---------------------------------------------+----------------------------+
| STATS: 1240+ | 420+ | 18 | 26               | Post a Business Opp (navy) |
+---------------------------------------------+   [+ Post Now (R)]         |
| LATEST OPPORTUNITIES (white card)           +----------------------------+
|  [All][Tenders][Partnership][Investment]... | Can't Find...? form        |
|  icon| title/desc |prov|org✓|deadline|badge |  selects + email           |
|  ... x9 rows ...        [View][Express (R)] |  [Submit Request (navy)]   |
|          [View More Opportunities]          +----------------------------+
+---------------------------------------------+ Why Use ...? 6 bullets     |
| FEATURED OPPORTUNITIES        < >           +-------------+--------------+
|  [img|card] [img|card] [img|card]           | Seekers     | Posters      |
+---------------------------------------------+ (blue card) | (cream card) |
| BROWSE BY SECTOR: 8 icon tiles              |             |              |
+---------------------------------------------+-------------+--------------+
```

### 1. Navbar (navy, ~64 px)
DRC-flag logo mark + "Trade in DRC" + yellow tagline "Connect – invest – Grow". 8 white nav links ("Home · Companies · Opportunities · Marketplace · Local Contacts · Market intelligence · Promote Your Business · Contact"). Right: yellow-outlined ghost pill "Register Your Company" + solid red pill with plus icon "Post an Opportunity".

### 2. Hero (~28% height)
Full-bleed photo composite (two businessmen in hard hats shaking hands, open-pit mine with yellow haul trucks, port crane with containers) under a navy multiply overlay. Centered white bold ~40 px H1 **"Explore Business Opportunities in the DRC"** + 2-line subhead ("Discover tenders, partnership calls, investment leads, procurement notices, and commercial opportunities across strategic sectors…"). Overlapping the hero bottom edge: **white search card** (~10 px radius, strongest shadow on page) with labeled fields — Keyword text input with magnifier, "All Types", "All Sectors", "All Provinces" dropdowns — plus red "Search" button. Below on the navy band: red filled pill "Browse Opportunities" (list icon) and white-outlined pill "Submit Opportunity" (send icon).

### 3. Stats strip (left column top)
One white rounded row, 4 cells with thin navy line icons + bold navy number + gray label, hairline vertical dividers: **"1,240+ Opportunities Listed" · "420+ Companies Active" · "18 Strategic Sectors" · "26 Provinces Covered"**.

### 4. "Latest Opportunities" card (left, dominant)
White card. 7 filter tab pills (1 px gray border, ~14 px radius; active "All" = navy fill/white text): All, Tenders, Partnership, Investment, Supply Requests, Export Opportunities (+1). Then a **9-row list table**, ~56 px rows, hairline dividers. Each row, left→right:
- ~40 px flat-colored rounded-square icon tile (orange truck, green leaf, yellow sun, blue hard-hat, brown coffee bean, blue gear, blue truck, blue wifi)
- semibold navy title + 2-line 12 px gray description (e.g. "Supply of Mining Equipment and Spare Parts")
- pin + province ("Lualaba Province, Kolwezi")
- organization + **green "Verified" checkmark** ("Gécamines SA ✓ Verified", "Min. of Infrastructure", "Min. of Digital Economy")
- calendar + deadline ("Deadline 30 Jun 2025")
- **tinted type badge**: Tender = blue tint, Partnership/Investment = lavender `#EDEBFA`, Supply Request = yellow tint `#FBF3DC`, Procurement = gray tint
- right column: stacked outlined "View Details" + solid red "Express Interest" buttons; some rows carry a small blue featured star.
Footer: centered outlined "View More Opportunities".

### 5. "Featured Opportunities" (left)
Heading + circular ghost prev/next carousel arrows. 3 horizontal media cards (~8 px radius): photo thumbnail left ~35% (solar array / haul trucks / factory floor), tiny tinted category badge (INVESTMENT / TENDER / PARTNERSHIP), bold title, pin location, 2-line gray copy, bold **red** deadline line ("Deadline: 28 Jun 2025").

### 6. "Browse by Sector" (left, bottom)
8 white bordered square tiles (~90 px, ~8 px radius) with colored icon + colored label: Mining (yellow pickaxe), Agriculture (green leaf), Energy (yellow sun), Construction (blue crane), Logistics (green truck), Digital & Telecom (blue wifi), Manufacturing (blue gear), Healthcare (red heart-cross).

### 7. Right sidebar (~32%)
1. **"Post a Business Opportunity"** navy promo card: yellow megaphone icon, white title, small copy ("Publish your tenders, sourcing requests, partnership calls, or investment leads…"), full-width red "Post Now".
2. **"Can't Find What You're Looking For? / Submit Your Business Need"** white form card: 2×2 selects (Need Type, Sector, Province, Company Name), email input, full-width navy "Submit Request" with send icon.
3. **"Why Use the Trade in DRC Opportunities Board?"** — 6 icon bullets (verified listings, nationwide reach across all 26 provinces, faster connections, increased visibility, access to strategic sectors, secure platform with professional support).
4. Two CTA cards side by side: light-blue `#E8F1FB` **"For Opportunity Seekers"** with navy "Start Exploring →"; cream `#FBF3DC` **"For Opportunity Posters"** with red "List an Opportunity →".

Density is dashboard-like: compact rows, weight-driven hierarchy, soft low-elevation shadows, 1 px `#E3E7EE` strokes, no gradients outside the hero.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Hero photo + navy overlay + H1 | Full-bleed photo, white 40 px H1, subhead | ❌ | — | App has a plain `PageHeader` (dark text on card bg, 2xl), no imagery, no navy band |
| Hero search card (Keyword + Type + Sector + Province + red Search) | White floating card, 4 fields, red button | 🟡 | `page.tsx` sidebar (`FilterSidebar`) | Filters exist as left-sidebar link lists (category/sector/deadline); **no keyword search, no province filter**, no horizontal search bar, no red button |
| "Browse Opportunities" / "Submit Opportunity" hero pills | Red pill + outlined pill on navy | ❌ | — | Only a dashed "+ add" tile in the featured strip links to `/dashboard/opportunities/new` |
| Stats strip (1,240+ / 420+ / 18 / 26) | 4-cell white row, navy icons/numbers | ❌ | — | No aggregate counts anywhere on the page |
| Filter tab pills (All/Tenders/Partnership/…) | Horizontal pills, active navy fill | 🟡 | `FilterGroup`/`FilterItem` in sidebar | Same taxonomy intent (8 categories: tender, ppp, investment_call, offer, demand, quotation, partner_search, project_launch) but rendered as vertical sidebar links, not pills |
| Opportunity list rows (icon tile, title+desc, province, org ✓Verified, deadline, tinted badge, 2 buttons) | Dense 9-row table, hairline dividers | 🟡 | `opportunity-card-design.tsx` | Rendered as a 2-col **card grid**, not a table. Card has badge, deadline, title, summary, region chip. **Missing:** colored icon tile, organization name, green Verified tick, View Details / Express Interest buttons, featured star |
| Tinted type badges (blue/lavender/yellow/gray per type) | Small colored pills | 🟡 | `category-badge.tsx` | One neutral variant only: `bg-muted` gray pill with Lucide icon for all 8 categories — no per-type tinting |
| "Express Interest" red button per row | Solid red, every row | 🟡 | `respond-dialog.tsx` (detail page only) | Functionality exists (opportunity_responses + inbox thread) but only on the detail page, default button styling, not red, not on the board |
| "View More Opportunities" footer button | Centered outlined | ❌ | — | Board loads up to 60 items flat; no pagination/load-more control |
| Featured Opportunities carousel (3 photo cards, red deadline) | Horizontal media cards + arrows | 🟡 | `featured-opportunity-strip.tsx` | Exists as a 6-col grid of the same small text cards (first 5 published, not curated `is_featured`); **no photos, no carousel arrows, no red deadline styling** |
| Browse by Sector (8 colored icon tiles) | White squares, colored icons/labels | ❌ | — | Sector exists only as sidebar filter text links |
| "Post a Business Opportunity" navy promo + red Post Now | Navy card, yellow megaphone | ❌ | — | Only the dashed add-tile; no promo module |
| "Submit Your Business Need" sidebar form | 2×2 selects + email + navy submit | ❌ (on this page) | `/[locale]/request` exists elsewhere | The Request-page concept exists as a separate route but is not surfaced on the opportunities board |
| "Why Use…" 6 icon bullets | Line icons + gray text | ❌ | — | Absent |
| Seeker / Poster CTA cards (blue / cream) | Tinted cards, navy vs red buttons | ❌ | — | Absent |
| Detail page ("View Details" destination) | Implied by row buttons | ✅ | `[category]/[slug]/page.tsx` | Solid: breadcrumb, meta, markdown body, budget, contact + respond dialog — exceeds the design's visible scope |
| Deep-linkable filters | Search card params | ✅ | `buildHref` in `page.tsx` | URL-param filters preserved across category/sector/deadline — matches intent |

## ❌ Design elements the app lacks entirely

**Hero & search**
- Photo hero with navy overlay + H1/subhead — needs curated imagery assets only.
- Keyword search field — needs FTS query over `opportunities` (FTS infra exists for other list pages: `src/components/list-pages/fts-ids.ts`).
- Province filter — needs a `province` column/enum on `opportunities` (app has free-text `region`).

**Trust & scale signals**
- Stats strip (opportunities/companies/sectors/provinces counts) — 4 cheap Supabase `count` queries, cached.
- Green "Verified" tick + organization name on each row — needs a join to `companies` (name, `verification_tier`) in `listPublishedResult`.
- Featured star / curated featured set — needs an `is_featured` flag on `opportunities`.

**Conversion modules (entire right sidebar)**
- "Post a Business Opportunity" promo card — static, links to existing `/dashboard/opportunities/new`.
- "Submit Your Business Need" form — reuse of existing `/request` flow, embedded.
- "Why Use…" bullets, Seeker/Poster CTA cards — static content + i18n keys.

**Navigation aids**
- Browse-by-Sector icon tiles — `sectors` table already exists with localized names.
- "View More Opportunities" pagination.

## 🎨 Visual-language delta

The design is loud, branded, and institutional: navy `#0B1F4B` structure, red `#D8232A` CTAs everywhere, yellow accents, photography, colored icon tiles, tinted badge taxonomy, dense table rows. The app page is quiet and monochrome: white/slate cards (`border-slate-200`, `rounded-2xl`), gray `bg-muted` badges, no photography, no brand red or navy on this page at all, generous card padding instead of 56 px table density. Even where a feature exists (badges, featured strip, filters), it reads as a neutral shadcn default rather than the DRC-flag brand system. The layout inversion is the biggest structural gap: design = top search hero + wide list + right action sidebar; app = left filter sidebar + card grid, with no above-the-fold search.

## 🔷 App features the design omits (regression watch-list)

- FR localization (design is EN-only; app is fully bilingual via next-intl).
- Deadline-window filter (`DEADLINE_WINDOWS`) and active-filters chip bar (`ActiveFiltersBar`).
- 8-category taxonomy richer than the design's ~6 tabs (offer, demand, quotation, project_launch).
- Detail page depth: breadcrumb, budget range, markdown body, contact thread, captcha-guarded respond flow with self-response blocking.
- Error and empty states (`EmptyState`, destructive error card).

## Verdict

**matchScore: 35**

The data layer and core flows the design implies — published listings, category/sector filtering, featured surfacing, a detail page, and an "express interest" mechanism — already exist and work. But visually the app shares almost nothing with the mockup: no hero, no search bar, no stats, no verified/organization trust signals on rows, no tinted badge system, no sector tiles, and none of the four right-sidebar conversion modules. The page currently reads as a generic gray shadcn list, while the design demands a dense, navy-red-yellow branded marketplace. Roughly a third of the design is functionally present in some form; almost none of it is present in the design's visual language.
