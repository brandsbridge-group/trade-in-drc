# Local Contacts — Explore by Province (source: 8.ai)

## 1. Page identification & purpose

This is the **"Explore Local Contacts by Province"** page — a geographic browse/discovery surface under the "Local Contacts" nav section (breadcrumb reads `Home ▶ Local Contacts ▶ Explore by Province`). Its job is to let international buyers pick a DRC province from an interactive map or a ranked list of "Key Economic Provinces," see how many companies/verified contacts exist per province, and drill into a province directory. A secondary purpose is lead generation: a "Featured Province" band (Lualaba) spotlights sectors + recommended companies and ends in a "Request a Local Contact" CTA. It is a mid-funnel directory hub, not a marketing hero page — dense, data-forward, transactional.

## 2. Layout & grid

Single desktop artboard (~1103 × 826 px shown, landscape). Structure top-to-bottom:

1. **Utility topbar** (dark navy, ~40px): logo left, "Power by BrandsBridge Group" right.
2. **Primary nav** (white, ~36px): 9 links left; two pill CTAs right ("Register Your Company" yellow, "Request a Partner" blue).
3. **Breadcrumb + page title block** (~90px): breadcrumb, H1, subtitle — left-aligned, full width.
4. **Main split section** (~350px tall): two columns roughly **52% / 48%**.
   - Left card: "Browse Provinces" — legend text + interactive DRC map with 7 pin markers; below-left a stacked pair of stat tiles (156,432 Companies Listed / 78,965 Verified Contacts) and a "View All Provinces" ghost button.
   - Right column: "Key Economic Provinces" header + **7 stacked row-cards** (Kinshasa, Haut-Katanga/Lubumbashi, Lualaba/Kolwezi, Kongo Central/Matadi, Nord-Kivu/Goma, Sud-Kivu/Bukavu, Tshopo/Kisangani). Each row: thumbnail photo → name + location pin → "Dominant Sectors" icon strip → company count → navy "Explore Province →" pill.
5. **Featured Province band** (~150px, cream/off-white card, full width, 4 sub-columns ≈ 30/25/25/20):
   - Col 1: "FEATURED PROVINCE" yellow badge, heading "Business Contacts and Local Partners in Lualaba", paragraph, 4 inline mini-stats (9,846 Companies / 6,215 Verified Contacts / 12 Strategic Sectors / High Investment Potential).
   - Col 2–3: "Key Sectors in Lualaba" — 2-col × 3-row icon+label grid (6 sectors).
   - Col 3: "Recommended Companies" — 3 mini company rows each with logo, name, category, green "✓ Verified" chip; "View All" link.
   - Col 4: "Need Verified Contacts in Lualaba?" card with icon, copy, yellow CTA "Request a Local Contact in Lualaba →".
6. **Footer** (dark navy, ~130px): logo + tagline + description left; 3 link columns (Quick Links / Resources / Company); "Power by BrandsBridge Group" + 4 circular social icons right; thin bottom bar with © line, center tagline, URL.

Density is high — very little dead whitespace; padding inside cards is tight (~12–16px). Everything left-aligned except nav CTAs and footer-right block.

```
┌──────────────────────────────────────────────────────────────┐
│ ▓ topbar: logo | Power by BrandsBridge                       │
│ nav: Home Companies Opportunities … | [Register] [Request]   │
├──────────────────────────────────────────────────────────────┤
│ Home ▶ Local Contacts ▶ Explore by Province                  │
│ H1: Explore Local Contacts by Province                       │
│ subtitle                                                     │
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
│ ▓ footer: logo/desc | Quick Links | Resources | Company |   │
│   socials — © bar                                            │
└──────────────────────────────────────────────────────────────┘
```

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#0B2447` / `#0A1F44` | Topbar, footer, "Explore Province" pills, H-level headings, map featured provinces |
| Primary blue | `#1E5AA8` / `#2563EB` | "Request a Partner" button, links, active nav accents, map mid-tone provinces, social icon strokes |
| Light blue | `#A9C4E4` | "Other Provinces" map fill |
| Pale blue/grey | `#D7E3F0` / `#E8EEF5` | "Not Available" map fill, card tints, stat tile backgrounds |
| Brand yellow | `#FFC629` / `#F5B700` | "Register Your Company" CTA, map pins, "FEATURED PROVINCE" badge, "Request a Local Contact" CTA, tagline accent words |
| Cream | `#FBF6EC` / `#FAF5EA` | Featured Province band background |
| Green | `#2E9E5B` | "✓ Verified" chips, tagline word "Grow" |
| Red (minor) | `#D64545` | Logo mark accent, BrandsBridge logo |
| White | `#FFFFFF` | Page background, cards, button text |
| Body grey | `#5B6B7C` | Subtitles, meta text, sector labels |
| Border grey | `#E3E8EF` | Card borders, dividers |

Brand logic: navy + blue as institutional base, **yellow reserved for conversion CTAs and geo-pins**, green strictly for verification/trust — echoing the DRC flag (blue/yellow/red) with red demoted to the logo only.

## 4. Typography

- Single geometric/neo-grotesque **sans** family throughout (Poppins/Inter-like), no serif anywhere.
- H1 "Explore Local Contacts by Province": ~26–28px, Bold, navy, sentence-with-capitals casing.
- Section headers ("Key Economic Provinces", "Browse Provinces", featured heading): ~15–18px SemiBold navy.
- Province names in rows: ~14px SemiBold navy; sub-location ~11px regular grey with pin icon.
- Micro-labels ("Dominant Sectors", stat captions): ~9–10px, some in Medium grey, Title Case.
- Big stat numbers (156,432 / 23,894 / 9,846): ~16–20px Bold navy — numerals are the loudest data element.
- Buttons: ~11–12px SemiBold, Title Case ("Explore Province", "Register Your Company").
- Nav links: ~11px Medium, Title Case. Footer links ~11px regular white/70%.
- Tagline "Connect – Invest – Grow": tiny caps-ish with per-word color (yellow/white/green).
- Tight line-heights (~1.2–1.35); no all-caps except the "FEATURED PROVINCE" badge.

## 5. Components

- **Topbar**: full-bleed navy strip; logo lockup (mark + "Trade in DRC" + tri-color tagline); right-side "Power by" + BrandsBridge logo.
- **Navbar**: white bar, 9 text links, two pill buttons — yellow filled (Register Your Company) and blue filled (Request a Partner), both ~radius 6px, no shadow.
- **Breadcrumb**: text + solid navy ▶ arrow separators.
- **Map card**: white card, 1px grey border, radius ~10px; contains helper copy, a 3-swatch legend (Featured/Other/Not Available), choropleth DRC map with 7 yellow teardrop pins + navy province name labels on dark chips.
- **Stat tiles** (×2): light-blue tinted rounded rectangles (~radius 8px) with line icon left, bold number + 2-line caption ("Companies Listed / Across All Provinces").
- **Ghost button**: "View All Provinces" — white, 1px border, list icon, radius ~6px.
- **Province row-card** (×7): white, 1px border, radius ~8px, ~48px tall; left square photo thumbnail (~radius 6px), name + 📍location, center "Dominant Sectors" label over 3–4 small line icons + "…" overflow, right-aligned bold count + "Companies", far-right navy pill button with arrow.
- **Featured band**: single cream container, radius ~10px, thin border; yellow rounded badge; inline mini-stat quartet separated by hairlines; sector grid items = small colored line icon + 11px label; recommended-company mini-rows = logo chip + name + category + green verified pill; right sub-card (white or pale tint) with icon, copy, yellow CTA button (radius ~6px) with arrow.
- **Verified chip**: pale green pill, green check + "Verified", radius full.
- **Footer**: 4-column layout, circular outlined social buttons (LinkedIn, Twitter, YouTube, Mail), hairline divider above © bar.

## 6. Borders, radii, shadows & effects

- Radius system: cards 8–10px, buttons/pills 6px, chips fully rounded, thumbnails 6px. No sharp corners.
- Strokes: consistent 1px `#E3E8EF` borders on every card/row; hairline dividers between mini-stats and footer bottom bar.
- Shadows: essentially none or ultra-subtle (flat design); depth comes from tint changes, not elevation.
- No gradients, no glassmorphism, no image overlays beyond simple photo crops. Map uses flat 3-step choropleth fills.
- Color-tinted fills (pale blue tiles, cream band) act as sectioning instead of heavy dividers.

## 7. Imagery & iconography

- **Photos**: 7 small city thumbnails (skylines/streets of Kinshasa, Lubumbashi, Kolwezi, Matadi, Goma, Bukavu, Kisangani road) — natural color, square crops, slight rounding, no duotone/overlay.
- **Map**: flat vector DRC choropleth with province boundaries; yellow map pins with dark dots; dark label chips.
- **Icons**: consistent **thin-line style**, ~1.5px stroke, slightly rounded — sector icons (mining pick, construction, energy bolt, agriculture leaf, logistics truck, industrial), stat icons (building, people), list icon, location pins, check marks. Sector icons in the featured band carry accent colors (yellow, orange, green). Company logos appear as small real-brand chips (Kamoa Copper SA, Tenke Fungurume, Lualaba Cement).
- Social icons: filled glyphs inside 1px-stroke circles, white on navy.

## 8. Content & copy

Language: **English**. Key strings (verbatim, incl. typos):
- Nav: `Home · Companies · Opportunities · Marketplace · Local Contacts · Market intelligence · Promote Your Business · Contact`; CTAs `Register Your Company`, `Request a Partner`.
- H1: `Explore Local Contacts by Province`; sub: `Search local companies and professional contacts across the key economic provinces of the DRC`.
- Left card: `Browse Provinces` — `Select a province on the map or choose from the list to explore local contacts.` Legend: `Featured Provinces / Other Provinces / Not Available`. Stats: `156,432 Companies Listed — Across All Provinces`, `78,965 Verified Contacts — Across All Provinces`, `View All Provinces`.
- Right list: `Key Economic Provinces` — rows with counts: Kinshasa `23,894`, Haut-Katanga/Lubumbashi `18,752`, Lualaba/Kolwezi `9,846`, Kongo Central/Matadi `6,712`, Nord-Kivu/Goma `7,684`, Sud-Kivu/Bukavu `6,233`, Tshopo/Kisangani `5,311` — each `Explore Province →`.
- Featured band: badge `FEATURED PROVINCE`; `Business Contacts and Local Partners in Lualaba`; body `Lualaba is the heart of the DRC's mining industry, rich in copper and cobalt resources and home to Kolwezi, a fast-growing industrial and logistics hub.` Stats `9,846 Companies / 6,215 Verified Contacts / 12 Strategic Sectors / High Investment Potential`. Sectors: `Mining & Minerals, Construction & Infrastructure, Energy & Electricity, Agriculture & Agro-Industry, Logistics & Transport, Industrial Manufacturing`. Companies: `Kamoa Copper SA (Mining & Minerals), Tenke Fungurume Mining (Mining & Minerals), Lualaba Cement SAS (Construction & Materials)` — all `Verified`. Right card: `Need Verified Contacts in Lualaba?` / `Get connected with trusted suppliers, distributors, and service providers in Lualaba.` / `Request a Local Contact in Lualaba →`.
- Footer: `Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo.`; columns `Quick Links (Companies, Opportunities, Products, Local Contacts)`, `Resources (Market Intelligence, Promote Your Business, News & Insights, Help Center)`, `Company (About Us, Terms of Use, Privacy Policy, Contact Us)`; `© 2024 Trade in DRC. All rights reserved.` · `Trade in DRC – Connecting international business with local opportunities.` · `www.tradeindrc.com`.
- Copy issues: `Power by` (should be "Powered by"), `Market intelligence` lowercase "i" inconsistency, English-only (site is EN/FR).

Tone: institutional, data-confident, B2B — big numbers used as trust proof.

## 9. UX assessment

**Works:**
- Map + ranked list dual navigation is a strong pattern: visual pickers for explorers, sortable list for task-driven users; counts on every row give instant market-size signal.
- Excellent CTA discipline: yellow = "ask us" (lead gen), navy = "browse"; one clear action per row.
- Verified chips + big verified-contact stats build the trust story this platform sells.
- The featured-province band is a smart monetizable slot (sponsored province) that also teaches the drill-down page's content model.

**Risky:**
- 9 nav items + 2 buttons will overflow at <1200px; needs priority collapse.
- Micro-type (9–10px labels, "Dominant Sectors" icons with no text labels) — icon-only sector strips are unguessable without tooltips; accessibility and mobile legibility problems.
- Yellow buttons with white text would fail contrast — must use navy text on yellow (the mock seems to use dark text; enforce it).
- Map interactivity: pins + choropleth need hover/focus states, keyboard access, and a non-map fallback (the list already is one — good).
- Number inconsistency risk: fictional counts (156,432) must come from real aggregates or credibility collapses.
- Row list of 7 doesn't scale to 26 DRC provinces — needs "View All" expansion behavior (button exists, flow undefined).
- English-only mock; FR strings will run ~20% longer — row layout must tolerate wrapping.

## 10. Mapping to TradeInDRC site

- **Route**: new page under Local Contacts — suggest `/[locale]/local-contacts/provinces` (with drill-down `/local-contacts/provinces/[slug]`). Closest existing surfaces: companies directory (`/companies`) and the request flow (customer-requested Request page, migration 00022). "Request a Local Contact" CTAs should deep-link into the existing request form pre-filled with `province`.
- **Data**: needs a `provinces` table (or enum) with company/contact counts aggregated from `companies`; sector icon strips map to existing `sectors` taxonomy (i18n already complete TR/ZH/ES per recent commits). Counts via a Supabase view or RPC, cached with React Query.
- **Nav**: mock's IA (Marketplace, Local Contacts, Market intelligence, Promote Your Business) diverges from current `NAVIGATION_CONFIG` — reconcile before build; add "Local Contacts" mega-menu entry.
- **Implementation (Tailwind/shadcn)**:
  - Map: inline SVG of DRC provinces (self-hostable, open-source constraint) with `data-province` paths, Tailwind fill classes for the 3-state choropleth, `<button>` wrappers for a11y; pins as absolutely positioned Lucide `MapPin`.
  - Province rows: shadcn `Card` variant, `grid grid-cols-[48px_1fr_auto_auto_auto]`; sector icons Lucide with `Tooltip` for labels.
  - Stat tiles: reuse dashboard stat-card pattern (memory: compact cards, light theme, info density — this mock matches those recorded preferences well).
  - Featured band: `bg-amber-50/60 border rounded-xl` container; verified chip = `Badge` variant `success`.
  - Buttons: map yellow → `bg-[#F5B700] text-[#0B2447]`; navy pill → primary variant.
  - Motion: per MOTION.md — ≤180ms hover fill on province rows/map paths, staggered ≤300ms list mount only; no map pin bouncing.
  - i18n: all strings via next-intl keys under `localContacts.provinces.*`; province names stay proper nouns, sector names reuse existing sector i18n.
