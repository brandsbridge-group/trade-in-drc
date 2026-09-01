# Explore Companies by Sector — design 9 vs current app

## Sources

- **Design PDF**: `/private/tmp/claude-501/.../scratchpad/designs/9.pdf` (source: `9.ai`, 1 page)
- **Design analysis md**: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/9-explore-companies-by-sector.md` (title-only stub — the PDF is the spec)
- **App route**: `/sectors` — `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/sectors/page.tsx`
- **Key components**:
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/sectors/sectors-grid.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/layout/page-header.tsx`
- (Secondary candidate `/market` — `src/app/[locale]/market/page.tsx` — is a marketplace segment shelf, not a sector directory; not the match.)

## THE DESIGN SPEC

```
┌────────────────────────────────────────────────────────────────────────┐
│ NAVY TOP BAR  [🗺 Trade in DRC / Connect–invest–Grow]   Power by ⬥ BB  │
├────────────────────────────────────────────────────────────────────────┤
│ WHITE NAV  Home Companies Opportunities Marketplace Local Contacts     │
│            Market intelligence Promote Your Business Contact           │
│                        [Register Your Company 🟡] [Request a Partner🔵]│
├────────────────────────────────────────────────────────────────────────┤
│ NAVY HERO with city/bridge PHOTO bleeding right                        │
│  "Explore Companies by Sector"  (white, bold, ~40px)                   │
│  grey-white intro paragraph (3 lines)                                  │
│  Home ▶ Local Contacts ▶ Explore by Sector   (breadcrumb, white)       │
├────────────────────────────────────────────────────────────────────────┤
│ SECTOR GRID — 3 cols × 2 rows, white cards, thin border, ~10px radius │
│ ┌ Mining&Minerals ┐ ┌ Energy&Electricity ┐ ┌ Construction&Infra ┐     │
│ │ 🟡icon  title    │ │ 🔵⚡ …            │ │ 🟠🏗 …             │     │
│ │ 2-3 line desc    │ │                   │ │                    │     │
│ │ 416 Companies ·  │ │ 289 · 214         │ │ 358 · 276          │     │
│ │ 312 Verified     │ │                   │ │                    │     │
│ │ [Explore Sector →] navy pill button    │ │                    │     │
│ └──────────────────┘ └───────────────────┘ └────────────────────┘     │
│ ┌ Logistics&Transp ┐ ┌ Agriculture&Agro ┐ ┌ Digital,Telecom&Tech ┐    │
│ │ 🔵🚚 198·143     │ │ 🟢🌿 276·203     │ │ 🟣📡 142·108        │    │
├────────────────────────────────────────────────────────────────────────┤
│ FEATURED SECTOR band (white card)                                      │
│ [PHOTO: excavator     ] "Featured Sector" (yellow eyebrow)             │
│ [ + dump truck        ] "Mining & Minerals" H2                         │
│ [🛡 Featured Sector    ] copper/cobalt/gold/diamonds paragraph          │
│  badge on photo         5 sub-category tiles (blue outline icons):     │
│                         Mining Equipment Suppliers · 128 Companies     │
│                         Safety Equipment Providers · 86                │
│                         Engineering Firms · 94                        │
│                         Logistics for Mining · 72                     │
│                         Laboratories & Testing Services · 36          │
│                     [🤝 Request a Verified Mining Partner →] 🟡 button │
├────────────────────────────────────────────────────────────────────────┤
│ NAVY FOOTER — logo+tagline, Quick Links / Resources / Company columns, │
│ social icons, © 2024, www.tradeindrc.com                               │
└────────────────────────────────────────────────────────────────────────┘
```

### Section 1 — Navy top bar + white nav
Dark navy (~#0B2A5B) brand bar: Trade in DRC map-logo, tagline "Connect – invest – Grow" (yellow/green words), right-aligned "Power by BrandsBridge Group" mark. Below: white nav strip with 8 items (Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact) and two pill CTAs — **"Register Your Company"** (yellow #F5A800, dark text) and **"Request a Partner"** (medium blue #2E74C9, white text).

### Section 2 — Hero band with photo
Full-width navy band, Kinshasa skyline/bridge photo bleeding in from the right with a diagonal navy overlay on the left. Left-aligned white H1 **"Explore Companies by Sector"**, 3-line intro: *"Discover local companies, service providers and potential partners operating in sectors that drive business and investment opportunities in the Democratic Republic of Congo."* Below it a breadcrumb **Home ▶ Local Contacts ▶ Explore by Sector** with chevron separators — the page lives under the "Local Contacts" IA branch in the design.

### Section 3 — Six sector cards (3×2 grid)
White cards, subtle 1px grey border, ~10px radius, light shadow, generous internal padding. Each card contains, top-to-bottom:
1. **Colored line-art icon** top-left, per-sector hue: Mining = yellow pickaxe/ore, Energy = blue lightning bolt, Construction = orange tower crane, Logistics = blue truck, Agriculture = green leaves, Digital = purple radio mast.
2. **Bold black title** (right of icon): "Mining & Minerals", "Energy & Electricity", "Construction & Infrastructure", "Logistics & Transport", "Agriculture & Agro-Industry", "Digital, Telecom & Technology".
3. **2–3 line grey descriptor**, e.g. "Discover mining companies, equipment suppliers, exploration firms and mineral processing specialists."
4. **Dual stat row** with small navy icons: check-badge + big number + "Companies" label, and shield-check + number + "Verified Partners" label. Numbers: 416/312, 289/214, 358/276, 198/143, 276/203, 142/108.
5. **Navy rounded CTA button** "Explore Sector →" (white text, arrow, ~6px radius) bottom-left of card.

### Section 4 — Featured Sector spotlight
Large white card. Left ~35%: photo of a mining excavator loading a haul truck at golden hour, with a **dark pill badge "🛡 Featured Sector"** overlaid bottom-left. Right: yellow eyebrow **"Featured Sector"**, H2 **"Mining & Minerals"**, paragraph: *"The DRC is one of the world's most mineral-rich countries, with vast reserves of copper, cobalt, gold, diamonds and more. Our verified mining sector partners support the entire value chain from exploration and extraction to processing and export."* Then **5 sub-category tiles** (white, thin border, blue outline icons — mine cart, hard hat, gear, truck, lab flask): Mining Equipment Suppliers (128 Companies), Safety Equipment Providers (86), Engineering Firms (94), Logistics for Mining (72), Laboratories & Testing Services (36). Bottom-right: **yellow CTA "🤝 Request a Verified Mining Partner →"** (dark text on #F5A800).

### Section 5 — Navy footer
Logo + tagline + gateway blurb; three link columns (Quick Links: Companies/Opportunities/Products/Local Contacts; Resources: Market Intelligence/Promote Your Business/News & Insights/Help Center; Company: About Us/Terms of Use/Privacy Policy/Contact Us); Power by BrandsBridge Group; 4 round social icons (LinkedIn, Twitter, YouTube, mail); bottom strip "© 2024 Trade in DRC. All rights reserved." · "Trade in DRC – Connecting international business with local opportunities." · "www.tradeindrc.com".

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs visually |
|---|---|---|---|---|
| Navy hero band w/ city photo | Navy + right-bleeding skyline photo, white left-aligned H1 | 🟡 | `src/components/layout/page-header.tsx` | App header is white, centered, no photo, no navy — "official minimal" instead of the design's photographic navy hero |
| Hero title "Explore Companies by Sector" | White bold ~40px | 🟡 | `sectors/page.tsx` (`t("title")`) | App says "Industry Sectors", dark slate text on white, centered |
| Hero intro paragraph | 3-line light-grey copy about local partners | 🟡 | `t("description")` | Present but different copy ("Explore verified Congolese companies…"), centered grey on white |
| Breadcrumb Home ▶ Local Contacts ▶ Explore by Sector | White text, chevron separators inside hero | ❌ | — | No breadcrumb anywhere on the page |
| 3×2 sector card grid | White cards, 1px border, ~10px radius | ✅ | `sectors/sectors-grid.tsx` (grid `lg:grid-cols-3`) | Grid + bordered rounded cards exist; card count is data-driven (all sectors), not curated 6 |
| Per-sector colored icon | Line-art, sector-specific hue (yellow/blue/orange/green/purple) | 🟡 | `iconForSlug()` in `sectors-grid.tsx` | Lucide icons mapped per slug, but all rendered in one `text-primary` on `bg-primary/10` square — no per-sector color coding |
| Sector title | Bold black, beside icon | ✅ | `sectors-grid.tsx` (`h3 text-xl font-bold`) | Placed bottom of card, not beside the icon |
| 2–3 line sector descriptor | Grey body copy per sector | ❌ | — | Cards have no description text at all |
| "N Companies" stat w/ icon | Check-badge icon + count | 🟡 | `t("companiesCount")` top-right of card | Count exists (real verified-company counts) but as small muted text, no icon, no big-number treatment |
| "N Verified Partners" stat w/ shield | Shield icon + count | ❌ | — | No second stat; app only counts companies |
| "Explore Sector →" navy button | Solid navy pill, white text, arrow | 🟡 | `sectors-grid.tsx` "Browse companies →" | Rendered as a text link with arrow, not a filled navy button |
| Featured Sector band | Photo + eyebrow + H2 + paragraph | ❌ | — | Entire section absent |
| "Featured Sector" photo badge | Dark pill with shield icon over image | ❌ | — | Absent |
| 5 mining sub-category tiles w/ counts | Bordered tiles, blue outline icons, "128 Companies" etc. | ❌ | — | Absent (no sub-category/category rollup UI on this page) |
| "Request a Verified Mining Partner →" yellow CTA | #F5A800 pill, handshake icon | ❌ | — | Absent (a `/request` page exists elsewhere, but no CTA from sectors) |
| Nav CTAs "Register Your Company" / "Request a Partner" | Yellow + blue pills in navbar | 🟡 | global navbar (`src/config/navigation.ts`) | App navbar exists but different structure/CTAs than the design's dual-pill pattern |
| Navy footer w/ 3 link columns + socials | Dark navy, BrandsBridge mark | 🟡 | global `Footer` layout component | Footer exists globally; branding/columns differ from design's BrandsBridge layout |

## ❌ Design elements the app lacks entirely

**Hero/navigation**
- Breadcrumb trail (Home ▶ Local Contacts ▶ Explore by Sector) — implies an IA where sectors sit under "Local Contacts"; needs a breadcrumb component only.
- Photographic navy hero — static asset + PageHeader variant, no backend.

**Sector cards**
- Per-sector marketing descriptor (2–3 lines) — implies `description_en/fr` columns on the `sectors` table (or CMS-managed copy).
- "Verified Partners" second stat — implies a partner/verification-tier count per sector distinct from plain company count (query on `companies` by tier).

**Featured Sector spotlight (whole section)**
- Featured-sector flag + editorial paragraph + photo — implies `is_featured` + description + image fields on `sectors` (or a CMS page block).
- Sub-category tiles with per-category company counts — data exists (`categories` table + `companies.category`), UI absent.
- "Request a Verified Mining Partner" CTA — front-end link to the existing `/request` flow, pre-filtered by sector.

## 🎨 Visual-language delta

The design is a **saturated, branded, high-density directory page**: deep navy (#0B2A5B) hero and footer, yellow (#F5A800) and blue accent CTAs, per-sector color-coded icons, photography in two places, big stat numbers, filled navy buttons. The app's `/sectors` page is a **minimal white utility page**: centered white header with a hairline divider, monochrome primary-tinted icon chips, muted small-text counts, text-link CTAs, zero imagery, uniform card color. Feature-wise the grid is there; brand-wise it reads as a different product. Density is also lower — the design packs descriptor + 2 stats + button per card, the app shows only icon, count, name, link.

## 🔷 App features the design omits

- Data-driven sector list from the `sectors` taxonomy table (design shows a fixed 6; app renders all sectors incl. Manufacturing, Services, Textiles, etc.).
- Real verified-company counts per sector (design numbers are static mock data).
- Full i18n (EN/FR + TR/ZH/ES sector names via `pickLocalized`).
- CMS-managed intro (`fetchPageContent("sectors-intro")`).
- Empty-state handling and reduced-motion-aware entry animation.
- Deep-link filtering: card links to `/companies?sector=<id>` (design's "Explore Sector" target unspecified).

## Verdict

**matchScore: 38**

The app has the structural skeleton of this design — a responsive 3-column grid of bordered sector cards with icons, names, real company counts, and a link into the filtered companies list — but almost none of its visual identity or secondary content. The navy photographic hero, breadcrumb, per-sector color coding, sector descriptions, dual Companies/Verified-Partners stats, filled "Explore Sector" buttons, and the entire Featured Sector spotlight (photo, editorial copy, five sub-category count tiles, yellow "Request a Verified Mining Partner" CTA) are all missing. Where elements do overlap, the app's minimal white styling diverges sharply from the design's saturated navy-and-yellow brand language. Roughly a third of the design is delivered, mostly the grid mechanics rather than the look.
