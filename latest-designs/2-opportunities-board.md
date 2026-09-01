# Opportunities Board (source: 2.ai)

## 1. Page identification & purpose

This is the **Opportunities listing page** ("Explore Business Opportunities in the DRC"). It is the marketplace-style hub where buyers, investors, and Congolese businesses find tenders, partnership calls, investment leads, procurement notices, supply requests, and export opportunities. The design serves double duty: a searchable directory (filter bar, list table, sector browse) AND a lead-generation surface (Post an Opportunity, Submit Your Business Need form, seeker/poster CTA cards). Intent: make the DRC feel like an active, credible deal-flow environment — stats, "Verified" badges, and ministry-backed listings all reinforce trust.

Branding note: the mockup is branded "Trade in DRC — Connect – invest – Grow", "Power by BrandsBridge Group". Copy is entirely **English**.

## 2. Layout & grid

Landscape desktop artboard (~1440-wide proportions). Structure top-to-bottom:

1. **Top navbar** — dark navy full-width bar (~64 px). Left: logo (DRC-flag-styled mark) + "Trade in DRC" + yellow tagline. Center: 9 nav links. Right: outlined "Register Your Company" + solid red "Post an Opportunity".
2. **Hero** (~28% of height) — full-bleed photo collage (businessmen in hardhats left, mining trucks/port cranes right) under a dark navy overlay. Centered H1 + 2-line subhead. Overlapping the hero's lower edge: a **white search/filter card** with 4 fields + red Search button, and below it two pill buttons (red "Browse Opportunities", outlined "Submit Opportunity") on the navy band.
3. **Main content area** — two columns on light gray (#F4F6F8-ish) background: **left column ~68%**, **right sidebar ~32%**.

Left column, top-to-bottom:
- **Stats strip**: 4 metrics in one white row (1,240+ / 420+ / 18 / 26), icon + number + label, vertical dividers.
- **"Latest Opportunities"** white card: 7 filter tab pills (All active in navy), then a **9-row list table**. Each row: colored icon tile • title + 2-line description • province • organization + green "Verified" tick • deadline • type badge • stacked "View Details" (outline) + "Express Interest" (red) buttons. Footer: centered outlined "View More Opportunities".
- **"Featured Opportunities"**: heading + carousel arrows; 3 horizontal cards (thumbnail photo left, category badge, title, location, 2-line description, red deadline line).
- **"Browse by Sector"**: 8 square icon tiles in one row (Mining, Agriculture, Energy, Construction, Logistics, Digital & Telecom, Manufacturing, Healthcare).

Right sidebar, top-to-bottom:
- **"Post a Business Opportunity"** navy promo card with megaphone icon + red "Post Now" button.
- **"Can't Find What You're Looking For?"** white form card: Need Type, Sector, Province, Company Name, Email + full-width navy "Submit Request".
- **"Why Use the Trade in DRC Opportunities Board?"** — 6 icon bullets.
- Two side-by-side CTA cards: light-blue "For Opportunity Seekers" (navy "Start Exploring →") and cream "For Opportunity Posters" (red "List an Opportunity →").

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

Density is high — dashboard-like, minimal whitespace, compact rows (~56 px each). Alignment is crisp left-edge within cards; the two-column split keeps action modules always visible beside the list.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#0B1F4B` / `#12224E` | Navbar, hero overlay band, active tab, sidebar promo card, "Submit Request" & "Start Exploring" buttons, headings |
| Brand red | `#D8232A` (≈ DRC flag red) | Primary CTAs: Post an Opportunity, Search, Express Interest, Post Now, deadlines text, List an Opportunity |
| Brand yellow | `#F5C518` | Tagline "Connect – invest – Grow", megaphone icons, poster-card accents, flag element in logo |
| Sky/flag blue | `#1E6FD9` | Logo flag field, links, some icons, Featured "Investment" badge tint |
| Green (success) | `#1DA84C` | "Verified" checkmarks, Agriculture icon |
| Light gray page bg | `#F3F5F8` | Page background behind cards |
| White | `#FFFFFF` | Cards, search bar, table rows |
| Slate text | `#33415C` / `#6B7280` | Body text, secondary meta |
| Light blue tint | `#E8F1FB` | "For Opportunity Seekers" card, Investment badge bg |
| Cream/soft yellow | `#FBF3DC` | "For Opportunity Posters" card, Supply Request badge bg |
| Lavender tint | `#EDEBFA` | "Investment"/"Partnership" badge backgrounds |

Brand logic: straight DRC-flag triad — **sky blue + red + yellow** — with navy standing in as the "governmental/institutional" neutral. Red = action, green = trust/verification, tints = categorization.

## 4. Typography

- Single **geometric/neo-grotesque sans** family throughout (Montserrat/Inter-like; condensed-ish bold in the H1).
- H1 "Explore Business Opportunities in the DRC": bold ~40 px white, sentence-ish title case.
- Section headings ("Latest Opportunities", "Featured Opportunities", "Browse by Sector"): bold ~20–22 px dark navy, title case.
- Row titles: semibold ~14 px navy; descriptions regular ~12 px gray, 2-line clamp.
- Meta (province, deadline, org): ~11–12 px with small leading icons.
- Buttons/badges: semibold ~11–13 px, title case (no all-caps except badge feel).
- Field labels above inputs: ~11 px medium gray ("Keyword", "Opportunity Type", "Sector", "Province").
- Nav links: ~13 px medium white. Tagline in yellow small caps-ish weight.
- Hierarchy is weight-driven (bold vs regular) more than size-driven — appropriate for the dense table.

## 5. Components

- **Navbar**: solid navy; logo lockup left; text links; 1 px yellow-outlined rounded (~8 px) "Register Your Company" ghost button with icon; solid red pill (~20 px radius) "Post an Opportunity" with plus icon.
- **Hero search card**: white, ~10 px radius, soft shadow, floats over hero/navy boundary. 4 inline fields — 1 text input with magnifier + 3 dropdown selects (1 px gray border, ~6 px radius, caret) — plus red Search button with icon. Labels sit above fields.
- **Hero secondary buttons**: red filled pill "Browse Opportunities" (list icon) and white-outlined transparent pill "Submit Opportunity" (send icon) on navy.
- **Stats strip**: single white rounded card, 4 cells with navy line icons (briefcase, people, layers, pin), bold navy number, gray label, thin dividers.
- **Filter tabs**: small pills, 1 px gray border, ~14 px radius; active = navy fill, white text. 7 tabs: All, Tenders, Partnership, Investment, Supply Requests, Export Opportunities (+ implied).
- **Opportunity list row**: leading ~40 px rounded-square icon tile (each a different flat color: orange truck, green leaf, yellow sun, blue hard-hat, brown coffee bean, blue gear, blue logistics truck, blue wifi); title + description; pin+province; org name + green verified tick; calendar+deadline; **type badge** (small tinted pill: Tender = blue tint, Partnership = lavender, Investment = lavender, Supply Request = yellow tint, Procurement = gray tint); right-aligned stacked buttons: outlined "View Details" + solid red "Express Interest" (both small, ~4–6 px radius, full column width). Some rows carry a small blue star (featured marker). Hairline row dividers.
- **Featured cards**: horizontal media card, ~8 px radius, thumbnail left (~35% width), tiny tinted category badge (INVESTMENT/TENDER/PARTNERSHIP), bold title, pin location, gray 2-line description, bold red "Deadline: 28 Jun 2025". Carousel prev/next circular ghost arrows top-right of heading.
- **Sector tiles**: 8 white bordered squares (~90 px), ~8 px radius, colored icon + colored label (icon color varies per sector: yellow pickaxe, green leaf, yellow sun, blue crane, green truck, blue wifi, blue gear, red heart-cross).
- **Sidebar promo card** (navy, ~10 px radius): yellow megaphone icon top-left, white bold title, small light copy, full-width red "Post Now" button.
- **Business-need form card** (white): 2×2 select grid (Need Type / Sector, Province / Company Name), full-width email input, full-width navy submit with send icon.
- **"Why Use" list**: 6 rows, small colored outline icons + 12 px gray text.
- **Seeker/Poster cards**: tinted backgrounds (light blue / cream), centered icon, bold title, 3-line copy, contrasting button (navy vs red) with arrow.

## 6. Borders, radii, shadows & effects

- Radius system: cards ~8–12 px; buttons mostly pills in hero/nav (~18–20 px) but rectangular ~4–6 px inside the table column — slight inconsistency worth normalizing.
- Strokes: 1 px light gray (#E3E7EE) on inputs, tabs, sector tiles, outline buttons; 1 px yellow on the nav ghost button.
- Shadows: soft, low-elevation (y≈2–4, blur≈10–16, ~8% black) on white cards; search card has the strongest lift.
- Hero: photographic background with a **navy multiply/gradient overlay**, darker at edges, plus a solid navy band at the bottom where the buttons sit. No glassmorphism, no gradients elsewhere — flat, institutional style.
- Hairline dividers between list rows and between stat cells.

## 7. Imagery & iconography

- **Hero photo(s)**: composite — left: two Black businessmen in suits + white hard hats shaking hands against a city skyline; right: open-pit mine with yellow haul trucks and shipping/port crane with containers. Treatment: darkened navy overlay for text legibility; edges blend into navy.
- **Featured thumbnails**: solar panel array (Solar Power Plant Development), mining haul trucks (Mining Services Contract), factory floor with workers in blue (Manufacturing Joint Venture). Straight photos, ~6 px radius, no duotone.
- **Icons**: mixed style — list-row tiles use flat filled colored glyphs inside rounded squares; stats and "Why Use" bullets use thin line icons; sector tiles use filled colorful icons. Generally rounded, friendly. Slight inconsistency (filled vs line) to unify at build time (Lucide line icons recommended).

## 8. Content & copy (transcribed)

- Nav: "Home · Companies · Opportunities · Marketplace · Local Contacts · Market intelligence · Promote Your Business · Contact" + "Register Your Company", "Post an Opportunity". (Note typo in source: "Comparies".)
- H1: **"Explore Business Opportunities in the DRC"**; sub: "Discover tenders, partnership calls, investment leads, procurement notices, and commercial opportunities across strategic sectors in the Democratic Republic of Congo."
- Stats: "1,240+ Opportunities Listed · 420+ Companies Active · 18 Strategic Sectors · 26 Provinces Covered".
- Sample rows: "Supply of Mining Equipment and Spare Parts — Lualaba Province, Kolwezi — Gécamines SA ✓ Verified — Deadline 30 Jun 2025 — Tender"; "Agro-processing Partnership Opportunity — AgriPlus DRC SARL"; "Solar Mini-Grid Project Development — GreenPower DRC"; "Construction of Administrative Complex — Min. of Infrastructure"; "Coffee Export Sourcing Program — Global Coffee Ltd (North Kivu, Goma)"; "Industrial Equipment Procurement — Congo Industries SA (Haut-Katanga, Lubumbashi)"; "Logistics & Transport Partnership — TransLog DRC"; "ICT Digitalization Project — Min. of Digital Economy".
- Sidebar: "Post a Business Opportunity — Publish your tenders, sourcing requests, partnership calls, or investment leads and connect with qualified businesses across the DRC."; "Can't Find What You're Looking For? Submit Your Business Need"; "Why Use the Trade in DRC Opportunities Board?" bullets: verified and credible listings, nationwide reach across all 26 provinces, faster connections with buyers and partners, increased visibility, access to strategic sectors and projects, secure platform with professional support.
- Tone: confident, institutional-commercial, benefit-led. **EN only** — FR versions must be authored.

## 9. UX assessment

**Works well:**
- Clear dual-audience architecture (seekers vs posters) with distinct color-coded paths (navy/explore vs red/post).
- Filter card overlapping the hero is a proven marketplace pattern; keeps search above the fold.
- List rows are information-rich but scannable: icon → title → geo → org+trust → deadline → type → action. "Verified" green ticks + ministry names build credibility.
- Stats strip and sector tiles give instant market-scale context.

**Risks / issues:**
- **Row action overload**: two stacked buttons on every one of 9 rows = 18 buttons; red "Express Interest" everywhere dilutes CTA hierarchy. Prefer row-click → detail, with Express Interest inside detail or on hover.
- **Red overuse**: Search, Browse, Express Interest ×9, Post Now, deadlines, List an Opportunity — everything screams. Reserve red for the 1–2 true conversions per viewport.
- Contrast concerns: yellow tagline on navy is fine, but 11 px gray meta text (#9AA…) on white will fail WCAG AA; deadline red on white is borderline at small sizes; white text over the busy hero photo needs the overlay guaranteed ≥ ~50%.
- 4-field filter bar + button will not fit mobile; needs stacked/sheet pattern.
- Badge tint system (Tender/Partnership/Investment/Supply/Procurement) uses low-contrast pastels — ensure text ≥ 4.5:1.
- Sidebar form ("Submit Your Business Need") duplicates the Request page concept — good, but must dedupe with existing `/request` flow.
- Mixed icon languages (flat colored vs line) and mixed button radii need a single system.

## 10. Mapping to TradeInDRC site

Maps to **`/[locale]/opportunities`** (existing route), with elements borrowed by `/request` (business-need form) and homepage (stats, sector browse).

Implementation notes (Next.js 16 + Tailwind v4 + shadcn):
- Hero: full-bleed `<section>` with `next/image` background + `bg-primary/70` overlay; filter card = shadcn `Card` with `Input` + 3 `Select`s + `Button`; on `md:` grid-cols-5, mobile stacked. Wire to Supabase `opportunities` query params (type, sector_id, province).
- Filter tabs: shadcn `Tabs` or `ToggleGroup` mapped to `opportunities.type` enum; "All" default.
- List: server component fetching from Supabase with RLS; row = `flex` layout, `Badge` variants per type (define `tender/partnership/investment/supply/procurement` badge variants in one place), `BadgeCheck` (Lucide) for verified (`companies.verification_tier`). Replace per-row double buttons with single row link + `Button variant="ghost"` Express Interest; interest posts to an `opportunity_interests` table (new migration) or opens contact modal.
- Stats strip: aggregate counts (opportunities, companies, sectors=18, provinces=26) — cheap Supabase `count` queries, cached/ISR.
- Featured carousel: shadcn `Carousel` (embla), max 3–5 items flagged `is_featured`.
- Sector tiles: reuse existing `sectors` table + i18n sector names (already localized); link to `/products?sector=` or `/sectors/[slug]`.
- Sidebar form: reuse the existing Request-page form component; navy submit button = `Button` default (primary).
- i18n: every string above needs `en`/`fr` keys in `src/config/messages/*`; the mockup gives EN only.
- Motion: per `docs/MOTION.md` — Emil-restraint: ≤180 ms hover lifts on cards, single fade/slide-up ≤300 ms on section mount, no per-row stagger beyond first viewport.
- Colors: map navy→`primary`, red→`destructive`-adjacent brand `accent` (define `--brand-red`, `--brand-yellow` tokens); do NOT hand-roll hexes per component.
