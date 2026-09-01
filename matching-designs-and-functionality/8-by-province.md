# Local Contacts — Explore by Province — design 8 vs current app

## Sources

- **Design PDF**: `/private/tmp/claude-501/.../scratchpad/designs/8.pdf` (single desktop artboard, "Explore Local Contacts by Province")
- **Design analysis**: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/8-local-contacts-by-province.md`
- **App route(s)** — no dedicated page exists (GAP). Closest surfaces:
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/companies/page.tsx` — companies directory with a province facet
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/list-pages/location-filter.tsx` — province filter (real data from `companies_public.province`)
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/contact-points/page.tsx` — "Local Contact Points" page (city dropdown + mock institution cards)
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/config/geo.ts` — canonical country/province option lists
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/config/navigation.ts` — nav has "Local Contact Points" → `/contact-points`, `/contact-points/regional`

## THE DESIGN SPEC

A dense, data-forward geographic hub page: pick a DRC province from an **interactive choropleth map** or a **ranked list of 7 "Key Economic Provinces"**, see company/verified-contact counts, drill into a province directory. Bottom band monetizes a "Featured Province" (Lualaba) with sectors, recommended companies, and a lead-gen CTA.

```
┌──────────────────────────────────────────────────────────────┐
│ ▓ topbar: logo | Power by BrandsBridge                       │
│ nav: Home Companies Opportunities … | [Register] [Request]   │
├──────────────────────────────────────────────────────────────┤
│ Home ▶ Local Contacts ▶ Explore by Province                  │
│ H1: Explore Local Contacts by Province  + subtitle           │
├───────────────────────────┬──────────────────────────────────┤
│ Browse Provinces          │ Key Economic Provinces           │
│  legend (3 swatches)      │ ┌ img│Kinshasa│sectors│23,894│▶ ┐│
│  ┌───────────────┐        │ ├ img│Haut-Katanga│…│18,752│▶  ┤│
│  │  DRC MAP      │        │ ├ img│Lualaba│…│9,846│▶        ┤│
│  │  📍×7 pins    │        │ ├ img│Kongo Central│…│6,712│▶  ┤│
│  └───────────────┘        │ ├ img│Nord-Kivu│…│7,684│▶      ┤│
│ [156,432] [78,965]        │ ├ img│Sud-Kivu│…│6,233│▶       ┤│
│ [View All Provinces]      │ └ img│Tshopo│…│5,311│▶         ┘│
├──────────────────────────┴───────────────────────────────────┤
│ FEATURED PROVINCE (cream band)                               │
│ Lualaba copy+4 stats │ 6 sector icons │ 3 companies │ CTA   │
├──────────────────────────────────────────────────────────────┤
│ ▓ footer: logo/desc | Quick Links | Resources | Company      │
└──────────────────────────────────────────────────────────────┘
```

### Section 1 — Topbar + navbar
- Navy (`#0B2447`) utility strip: logo lockup + tri-color tagline "Connect – Invest – Grow" (yellow/white/green), right "Power by BrandsBridge Group".
- White nav bar, 9 links (`Home · Companies · Opportunities · Marketplace · Local Contacts · Market intelligence · Promote Your Business · Contact`), two pill CTAs: yellow `Register Your Company` (`#F5B700`, radius ~6px), blue `Request a Partner` (`#2563EB`). Flat, no shadows.

### Section 2 — Breadcrumb + title block
- Breadcrumb `Home ▶ Local Contacts ▶ Explore by Province` with solid navy ▶ separators.
- H1 `Explore Local Contacts by Province` (~26–28px Bold navy); subtitle `Search local companies and professional contacts across the key economic provinces of the DRC` in body grey `#5B6B7C`.

### Section 3 — Browse Provinces map card (left column, ~52%)
- White card, 1px `#E3E8EF` border, radius ~10px.
- Header `Browse Provinces` + helper copy `Select a province on the map or choose from the list to explore local contacts.`
- 3-swatch legend: `Featured Provinces` (deep navy), `Other Provinces` (light blue `#A9C4E4`), `Not Available` (pale `#D7E3F0`).
- **Flat vector DRC choropleth** with province boundaries in 3 fill states; **7 yellow teardrop map pins** with dark dots + navy label chips (Tshopo, Nord-Kivu, Sud-Kivu, Kinshasa, Kongo Central, Haut-Katanga, Lualaba).
- Two **stat tiles** below (pale-blue tinted rounded rects, ~radius 8px, line icon left): `156,432 Companies Listed — Across All Provinces` and `78,965 Verified Contacts — Across All Provinces`. Numerals ~16–20px Bold navy — loudest data element on the page.
- Ghost button `View All Provinces` — white, 1px border, list icon, radius ~6px.

### Section 4 — Key Economic Provinces list (right column, ~48%)
- Header `Key Economic Provinces` (~15–18px SemiBold navy).
- **7 stacked row-cards** (~48px tall, white, 1px border, radius ~8px), each: square city photo thumbnail (radius 6px) → province name SemiBold navy + 📍 sub-location grey ~11px → `Dominant Sectors` micro-label over 3–4 thin-line sector icons + `…` overflow → right-aligned bold count + "Companies" → far-right navy pill `Explore Province →`.
- Rows/counts: Kinshasa `23,894` · Haut-Katanga/Lubumbashi `18,752` · Lualaba/Kolwezi `9,846` · Kongo Central/Matadi `6,712` · Nord-Kivu/Goma `7,684` · Sud-Kivu/Bukavu `6,233` · Tshopo/Kisangani `5,311`.
- Photos: natural-color skylines/streets of the 7 cities, square crops, no overlay.

### Section 5 — Featured Province band (full width, cream `#FBF6EC`, radius ~10px, thin border, 4 sub-columns ≈ 30/25/25/20)
- **Col 1**: yellow rounded badge `FEATURED PROVINCE` (only all-caps element); heading `Business Contacts and Local Partners in Lualaba`; body copy about copper/cobalt and Kolwezi; inline mini-stat quartet separated by hairlines: `9,846 Companies / 6,215 Verified Contacts / 12 Strategic Sectors / High Investment Potential`.
- **Col 2**: `Key Sectors in Lualaba` — 2×3 icon+label grid with accent-colored thin-line icons: Mining & Minerals, Construction & Infrastructure, Energy & Electricity, Agriculture & Agro-Industry, Logistics & Transport, Industrial Manufacturing.
- **Col 3**: `Recommended Companies` + `View All` link — 3 mini rows (logo chip, name, category, pale-green fully-rounded `✓ Verified` pill `#2E9E5B`): Kamoa Copper SA, Tenke Fungurume Mining, Lualaba Cement SAS.
- **Col 4**: sub-card `Need Verified Contacts in Lualaba?` — people icon, copy `Get connected with trusted suppliers, distributors, and service providers in Lualaba.`, **yellow CTA** `Request a Local Contact in Lualaba →`.

### Section 6 — Footer
- Navy, 4 columns: logo + tagline + gateway description; `Quick Links` (Companies, Opportunities, Products, Local Contacts); `Resources` (Market Intelligence, Promote Your Business, News & Insights, Help Center); `Company` (About Us, Terms of Use, Privacy Policy, Contact Us). Circular outlined social icons (LinkedIn, Twitter, YouTube, Mail). © bar: `© 2024 Trade in DRC. All rights reserved.` · center tagline · `www.tradeindrc.com`.

### Visual language
- Radii: cards 8–10px, buttons 6px, chips fully rounded. 1px `#E3E8EF` strokes everywhere; **no shadows, no gradients** — depth via tint changes (pale-blue tiles, cream band). Yellow strictly = conversion CTAs + map pins; green strictly = verification; big bold navy numerals as trust proof. Micro-labels at 9–10px; tight ~1.2–1.35 line-heights.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Dedicated "Explore by Province" page/route | Full page under Local Contacts | ❌ | — | No route exists; closest is `/companies?region=X` and `/contact-points` |
| Breadcrumb `Home ▶ Local Contacts ▶ Explore by Province` | Navy ▶ separators | ❌ | — | No such page; list pages use `PageHeader`, no breadcrumb of this shape |
| H1 + subtitle block | 26–28px bold navy + grey sub | 🟡 | `src/components/design` `PageHeader` (used by contact-points/companies) | Pattern exists but with different copy/route context |
| Interactive DRC choropleth map (3-state fills) | Flat vector, province boundaries | ❌ | `public/images/landing/drc-map.webp` only | Only a static webp image on the landing page — not interactive, no choropleth states |
| 7 yellow map pins + navy label chips | Teardrop pins on featured provinces | ❌ | — | Absent |
| Map legend (Featured/Other/Not Available) | 3 color swatches | ❌ | — | Absent |
| Stat tiles: 156,432 Companies / 78,965 Verified Contacts | Pale-blue tinted tiles, bold navy numerals | 🟡 | `src/components/layout/stats.tsx` (homepage stats) | Homepage has platform stats, but not province-scoped, not tile-in-map-card layout, not verified-contact aggregate |
| `View All Provinces` ghost button | White, 1px border, list icon | ❌ | — | Absent |
| Province row-cards ×7 (photo, pin, sector icons, count, pill CTA) | 48px rows, thumbnail, "Dominant Sectors" icons, bold count, navy `Explore Province →` pill | ❌ | — | Nothing comparable; province appears only as a plain text link list in the `/companies` filter sidebar (`location-filter.tsx`) — no photos, counts, sector icons, or CTA |
| Per-province company counts | Bold numerals per row | ❌ | — | `LocationFilter` lists distinct provinces without counts |
| City thumbnails (Kinshasa, Lubumbashi, Kolwezi, …) | Natural-color square crops | ❌ | — | No province/city imagery in app |
| Filter/browse companies by province | Behavior behind `Explore Province →` | 🟡 | `src/app/[locale]/companies/page.tsx` (`q.eq("province", region)`) + `location-filter.tsx` | Functionally exists as a sidebar facet on `/companies` — but as a plain text filter list, visually nothing like the design's geo hub |
| `FEATURED PROVINCE` cream band | Cream `#FBF6EC` container, yellow badge | ❌ | — | Absent |
| Featured mini-stat quartet (9,846 / 6,215 / 12 / High) | Inline hairline-separated stats | ❌ | — | Absent |
| Key Sectors icon grid (2×3) | Accent-colored thin-line icons + labels | 🟡 | Sectors taxonomy exists (`sectors` table, sector filters, i18n) | Data exists; the visual grid + province-scoped "dominant sectors" mapping does not |
| Recommended Companies mini-rows w/ Verified chips | Logo chip + name + category + green pill | 🟡 | `src/components/layout/featured-companies.tsx`, verified badges via verification_tier | Featured companies exist on homepage; verified chip pattern exists; not province-scoped, not in this band layout |
| `Request a Local Contact in Lualaba →` yellow CTA | Yellow filled, radius 6px | 🟡 | `src/components/requests/business-request-form.tsx` (request flow, migration 00022; form has province field) | Request flow exists but no province-pre-filled deep link and no yellow lead-gen card on any province surface |
| `Need Verified Contacts…?` lead-gen sub-card | White/pale card, icon, copy, CTA | ❌ | — | Absent |
| Nav item "Local Contacts" w/ province explorer entry | Nav link to this page | 🟡 | `src/config/navigation.ts` lines 124–130: "Local Contact Points" → `/contact-points`, `/contact-points/regional` "Find support in your specific province or region" | Nav slot exists but `/contact-points/regional` points at a city-based mock page, not a province explorer |
| Topbar "Power by BrandsBridge" + tri-color tagline | Navy strip lockup | ❌ | Navbar exists but different branding structure | App navbar has no BrandsBridge topbar/tagline strip |
| Footer 4-col (Quick Links/Resources/Company + socials) | Navy, circular social icons | 🟡 | Global `Footer` in layout | Footer exists; column taxonomy and copy differ from mock |

## ❌ Design elements the app lacks entirely

**Geo-navigation core**
- Interactive DRC choropleth map with clickable provinces + pins → implies an inline SVG of DRC province boundaries with a `data-province` mapping (open-source constraint: hand-built SVG).
- Province explorer page + drill-down (`Explore Province →`) → implies a route like `/local-contacts/provinces[/slug]` and a canonical `provinces` reference (only free-text `companies.province` exists today).
- Per-province company/verified-contact counts (rows + global stat tiles) → implies a Supabase aggregate view/RPC over `companies_public` grouped by province + verification tier.
- "Dominant Sectors" per province icon strips → implies a province×sector aggregate (top-N sectors by company count per province).
- Province/city photo thumbnails → implies an image asset set for ~7+ cities.

**Featured Province monetization band**
- FEATURED PROVINCE badge, editorial copy, mini-stat quartet, key-sector grid, recommended companies, lead-gen card → implies a "featured province" content record (admin-curated: copy, sectors, recommended company IDs) + province-pre-filled deep link into the existing request form.

**Chrome**
- Breadcrumb trail with ▶ separators; "View All Provinces" expansion (26 provinces); BrandsBridge topbar lockup.

## 🎨 Visual-language delta

The design is flatter, denser, and more numeral-driven than the current app. It uses zero shadows and 1px `#E3E8EF` borders with tint-based sectioning (pale-blue stat tiles, cream featured band) — the app's list pages (`ListPageShell`, `CompanyRow`, `FilterSidebar`) are closer to standard shadcn styling with `rounded-xl` cards and slate borders, which is broadly compatible but lacks the design's cream/amber band and pale-blue tile accents. The design's yellow-for-conversion discipline (`#F5B700` CTAs, yellow pins) and green-only-for-verified chips exist partially in the app (verification badges) but yellow lead-gen CTAs are not part of the current palette usage. Biggest gap in feel: the design sells geography with big bold navy numbers and photography per province; the app renders province as an unadorned text facet in a sidebar — no counts, no imagery, no map. Micro-typography (9–10px labels, icon-only sector strips) is denser than anything the app currently ships.

## 🔷 App features the design omits

- Full faceted filtering (sector, segment, verification tier, certification, FTS search, sort) on `/companies` — the design's province rows have no search/sort.
- `/contact-points` institutional directory (chambers of commerce, ANAPI, etc.) per city — a different but overlapping "local contacts" concept the design doesn't show (currently mock data).
- Bilingual EN/FR rendering (design is English-only; FR strings run ~20% longer — row layout must tolerate wrapping).
- Locale-aware routing, auth-gated request flow, RFQ banner on companies list.

## Verdict

**matchScore: 12/100.** This page does not exist in the app in any form. The only design elements with real counterparts are the underlying capability (filtering companies by `province` via `location-filter.tsx` + `q.eq("province", region)` on `/companies`), platform-level stat and featured-company patterns on the homepage, and the request form the yellow CTA would deep-link into. Every visual centerpiece — the interactive choropleth map, pins, legend, the 7 photo-and-count province rows, the stat tiles, and the entire Featured Province monetization band — is missing. The existing `/contact-points` page occupies the "Local Contacts" nav slot but is city-based, mock-data, and visually unrelated. Building this page means new aggregates (province counts, dominant sectors), a canonical provinces list, an SVG DRC map, and a featured-province content model, not a restyle of anything that exists.
