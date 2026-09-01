# Homepage — design 1 (Marketplace Landing) vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/1.pdf`
- Design analysis: `latest-designs/1-marketplace-landing.md`
- App route: `src/app/[locale]/page.tsx` (the live homepage; old composition preserved at `src/app/[locale]/home-classic/`)
- Key components:
  - `src/components/home/landing/landing-hero.tsx`, `hero-backdrop.tsx`
  - `src/components/home/home-search-band.tsx` + `home-search-panel.tsx` (anonymous search)
  - `src/components/home/hero-search-for-signed-in.tsx`
  - `src/components/home/home-carousel.tsx` (admin-curated `carousel_slides`)
  - `src/components/home/featured-companies-strip.tsx` (verified spotlight, migration 00016)
  - `src/components/home/landing/landing-trust-ribbon.tsx`, `landing-sectors.tsx`, `landing-features.tsx`, `landing-why-drc.tsx`, `landing-join-cta.tsx`, `landing-transform-banner.tsx`
  - `src/components/home/site-footer.tsx`, `src/components/layout/navbar.tsx`, `src/config/navigation.ts`
  - Buying-request form (off-homepage): `src/app/[locale]/(public)/request/`

## THE DESIGN SPEC

A dense, flat, conversion-oriented **marketplace landing**. DRC-flag palette: deep navy `#0B1F3A` surfaces, **red `#D8232A` for every conversion CTA**, gold `#F5B800` accents, cream `#FDF6E3` secondary bands. Hairline `#E3E6EA` borders, ~6–8px radii, **no shadows, no gradients except the hero overlay**. Single geometric sans (Montserrat/Poppins-like). Below the stats bar the body is a **~65/35 two-column split** — main content left, persistent lead-capture rail right.

```
+--------------------------------------------------------------------------+
| LOGO  Home Companies Opportunities Marketplace ...   [Register][Post Req]|
+--------------------------------------------------------------------------+
| HERO photo collage (coffee | port containers | truck | workers)          |
|   "Explore the Trade in DRC Marketplace"                                 |
|   [Search products | Category v | Province v | Supplier type v |Search]  |
|   [Browse Products] [Find Suppliers]                                     |
+--------------------------------------------------------------------------+
| 5,000+ Products | 850+ Companies | 120+ Verified | 26 Provinces | 20+ Cat|
+---------------------------------------------+----------------------------+
| Explore Products by Category (6x2 chips)    | Can't Find What You're     |
|                                             | Looking For?  (form card)  |
| Featured Products (6 cards)                 |  Product/Category/Qty/     |
|                                             |  Country/Company/Email/    |
| Meet Verified Suppliers (6 cards)           |  Phone/Requirements        |
|                                             |  [Submit Buying Request]   |
| [For Buyers dark] [For Sellers light]       | Why Use Marketplace? (2x3) |
+---------------------------------------------+----------------------------+
| FOOTER: logo/tagline | QuickLinks Resources About Support | socials      |
+--------------------------------------------------------------------------+
| Trade in DRC – Connecting international business with local opportunities|
+--------------------------------------------------------------------------+
```

### 1. Navbar (navy `#0B1F3A`, ~64px)
- Left: hexagonal DRC-flag logo mark + "Trade in DRC" wordmark + tri-color tagline "Connect – invest – Grow".
- Center: **8 links** — Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact.
- Right: outlined white pill "**Register Your Company**" (person icon) + solid **red** pill "**Post a Buying Request**" (cart icon).
- Micro-credit top-right: "Power by BrandsBridge Group".

### 2. Hero (photo collage + faceted search)
- Background: 4-image photo collage (red coffee cherries → port containers/cranes → yellow cargo truck → two hi-vis workers with excavator), navy gradient overlay left→center.
- H1 white extra-bold ~36px: "**Explore the Trade in DRC Marketplace**"; subcopy: "Discover quality products, trusted suppliers, and real business opportunities from the Democratic Republic of Congo."
- **Search bar**: one white rounded rect (~8px) split into 4 segments — text input "Search products" (magnifier) + 3 dropdowns (**Category, Province, Supplier type**) + red "**Search**" button capping the right end.
- Below: red filled pill "**Browse Products**" (grid icon) + navy-outlined pill "**Find Suppliers**" (people icon).

### 3. Stats bar (navy strip)
5 items, each = gold line icon in rounded square + bold white number + tiny label:
**5,000+ Products Listed · 850+ Companies · 120+ Verified Suppliers · 26 Provinces Covered · 20+ Categories**.

### 4. "Explore Products by Category" (left column)
2 rows × 6 = **12 compact chip-cards**: light-gray fill, ~8px radius, thin border, small multicolored flat icon in white square + 2-line bold label. Categories: Agriculture & Agro-products; Mining Products & Minerals; Construction Materials; Industrial Equipment; Energy & Electrical Supplies; Textiles & Fashion; FMCG / Consumer Goods; Pharmaceuticals & Health Products; Logistics & Packaging; Machinery & Spare Parts; Digital & Technology Solutions; Furniture & Office Supplies.

### 5. "Featured Products" (6 cards + red "View All Products →")
White cards, 1px border, ~8px radius, square photo top. Each: bold name, supplier + blue verified tick, pin + city, 2-line gray description, then two footer buttons: outlined "**View Product**" + solid red "**Request Quote**". Examples: Copper Cathodes (Kibali Copper SARL, Kolwezi), Coffee Beans (Congo Coffee Export, Bukavu), Solar Panels 550W, Safety Equipment Kit, Processed Cassava Flour, Timber Products.

### 6. "Meet Verified Suppliers" (6 cards + "View All Suppliers →")
Logo image top, company name + blue verified check, sector, location, "**NNN Products**" count, outlined "**View Supplier**" + red "**Contact Supplier**". Examples: Kibali Copper SARL (248 Products), Agro Foods DRC (156), Green Energy DRC (122), Congo Textiles SARL (98).

### 7. Audience banners (side-by-side)
- "**For Buyers**": navy card, gold circular handshake icon, white copy, red "**Start Sourcing →**".
- "**For Sellers**": cream card, storefront icon in gold circle, dark copy, red "**List Your Products →**".

### 8. Right rail — buying-request form (the page's lead-gen anchor)
Navy header "**Can't Find What You're Looking For?**" + "Submit a buying request and our team will help you find the right supplier." White body, 2-column grid, 8 fields: Product Needed*, Category* (select), Quantity*, Country* (select), Company Name*, Email*, **Phone / WhatsApp*** (flag + dial-code prefix), Additional Requirements (textarea). Full-width red bar "**Submit Buying Request**" with send icon.

### 9. Right rail — "Why Use the Trade in DRC Marketplace?" (2×3 benefits)
Verified Business Profiles · Local Market Access · B2B Inquiry Support · Supplier Visibility · Export & Partnership Potential · Business Facilitation — each a small line icon + micro-title + 2-line gray text.

### 10. Footer (near-black `#081524`) + bottom strip
Big flag logo + "TRADE IN DRC / CONNECT – INVEST – GROW" + mission line; 4 columns: **Quick Links** (Home, Companies, Opportunities, Marketplace), **Resources** (Market Intelligence, Local Contacts, Business Guide, FAQ), **About** (About Us, How It Works, Terms of Use, Privacy Policy), **Support** (Contact Us, Help Center, Submit Feedback); "**Stay Connected**" with 4 colored social circles (Facebook, LinkedIn, Twitter/X, YouTube) + gold "**Upgrade to Premium →**" button; "© 2025 BrandsBridge Group." Below: cream strip, centered navy line "Trade in DRC – Connecting international business with local opportunities."

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Navy navbar, logo + tri-color tagline | `#0B1F3A`, hexagon flag mark | 🟡 | `src/components/layout/navbar.tsx` | App navbar exists with mega-menu; no tri-color "Connect – invest – Grow" tagline lockup |
| 8 flat nav links (incl. Local Contacts, Market intelligence, Promote Your Business) | white ~12px text links | 🟡 | `src/config/navigation.ts` | App uses mega-menu groups (Marketplace, Products, Request, Pricing, Resources…) — different IA, no flat 8-link row |
| "Register Your Company" outlined pill | white outline, person icon | 🟡 | `navbar.tsx` (auth buttons) | App shows sign-in/register via auth modal buttons; label/placement differ |
| "Post a Buying Request" solid red CTA | red `#D8232A` pill, cart icon | 🟡 | navbar CTA → `/request` exists | App's primary nav CTA is **gold** (`bg-landing-gold`), not red; wording differs |
| Hero photo collage (coffee/port/truck/workers) | 4 photos + navy overlay gradient | ❌ | `landing/hero-backdrop.tsx` | App hero is an abstract animated navy backdrop — no commodity photography |
| Hero H1 "Explore the Trade in DRC Marketplace" | white extra-bold ~36px | 🟡 | `landing/landing-hero.tsx` | App H1 is "Trade in DRC / Your Gateway to Trusted Business…" — marketing copy, not marketplace copy |
| 4-segment faceted search bar (product + Category + Province + Supplier type + red Search) | single white rounded rect, red cap button | 🟡 | `home-search-band.tsx` + `home-search-panel.tsx` | App has ONE free-text input with entity tabs (All/Companies/Products/Opportunities); **no Category/Province/Supplier-type dropdowns**, no red button; placed in a band *below* the hero for anonymous users |
| "Browse Products" + "Find Suppliers" hero pills | red filled + navy outlined | 🟡 | `landing-hero.tsx` CTAs | App CTAs: "Explore Opportunities" / "Find Partners" — different labels/targets, gold-not-red |
| Stats bar (5,000+ / 850+ / 120+ / 26 / 20+) | navy strip, gold icons, 5 metrics | ❌ | `stats-strip.tsx` exists but NOT rendered on `page.tsx` | Landing shows only a one-line `LandingTrustRibbon` ("Trusted Connections. Real Opportunities."); no 5-metric counters bar |
| 12 category chips ("Explore Products by Category") | gray chips, multicolor icons, 6×2 | 🟡 | `landing/landing-sectors.tsx` | App shows **6 large sector image cards** (mining, agriculture, energy, infrastructure, forestry, manufacturing) titled "Invest in the DRC's strengths" — investment sectors, not the 12 marketplace product categories, and a photo-card treatment instead of compact chips |
| Featured Products grid (6 cards, View Product + Request Quote) | bordered white cards, square photos, dual CTAs | ❌ | products exist at `/products`; homepage has `home-carousel.tsx` (admin slides) | No product cards on the homepage at all; carousel is admin CMS slides, not product listings |
| "View All Products →" red link | red text link | ❌ | — | Absent |
| Meet Verified Suppliers (6 logo cards, product counts, Contact Supplier) | white cards, blue verified check | 🟡 | `featured-companies-strip.tsx` | App has an admin-curated "Verified spotlight" strip of verified companies — different card anatomy (no product counts, no dual View/Contact red buttons) |
| For Buyers banner (navy, red "Start Sourcing →") | dark card + gold handshake icon | ❌ | closest: `landing-join-cta.tsx` / `landing-transform-banner.tsx` | Generic "Join the platform" CTA; no buyer-specific banner |
| For Sellers banner (cream, "List Your Products →") | cream card + storefront icon | ❌ | — | No seller-specific banner; no cream surface anywhere on the page |
| Right-rail buying-request form (8 fields, phone w/ dial code, red submit) | navy-header card, 2-col field grid | ❌ on homepage | full form lives at `src/app/[locale]/(public)/request/` (migration 00022) | The form exists as its own page but the homepage has no embedded lead-capture rail; nav "Submit a Request" is the only path |
| "Why Use the Marketplace?" 2×3 benefits card | 6 icon+micro-title items | 🟡 | `landing/landing-features.tsx` (3 items) + `Home.why` (3 items on classic) | App shows 3 feature cards (Verified Partners / Market Opportunities / Business Intelligence), not the 6 marketplace benefits; not in a right rail |
| 65/35 two-column layout with persistent right rail | main + sticky lead rail | ❌ | `page.tsx` | App is fully single-column stacked full-width sections |
| Footer: 4 link columns + Stay Connected socials | near-black, colored social circles | 🟡 | `site-footer.tsx` | App footer has tagline + legal links (terms/privacy/cookies); no 4-column Quick Links/Resources/About/Support structure, no social circles |
| Footer "Upgrade to Premium →" gold button | gold pill in footer | ❌ | Pricing page exists at `/pricing`; nav has "Get Premium" quick-action (signed-in) | No premium button in the footer |
| Bottom cream tagline strip | cream band, centered navy line | ❌ | — | Absent |
| Verified blue check badges on cards | blue circle + white check | 🟡 | company verification status rendered in strips/list pages | Present in concept (verified filter) but the design's ubiquitous blue-tick-next-to-name treatment isn't the homepage pattern |

## ❌ Design elements the app lacks entirely (grouped)

**Hero / search**
- Photo-collage hero with commodity imagery — needs 4 licensed/owned photos, no backend.
- Faceted search: Category + Province + Supplier-type dropdowns — implies taxonomy + province + supplier-type filter params wired to the products/companies query (taxonomy and provinces already exist in DB).

**Trust / stats**
- 5-metric stats bar (Products Listed, Companies, Verified Suppliers, Provinces, Categories) — implies live Supabase counts (products, companies, verification tier, taxonomy).

**Marketplace content on the homepage**
- Featured Products grid with "Request Quote" per card — implies a featured/curated products query + quote (RFQ) deep link per product.
- 12 marketplace category chips — implies mapping to existing `sectors`/`categories` taxonomy (bilingual columns exist).
- "View All Products / Suppliers" red links.

**Lead capture**
- Embedded right-rail buying-request form — the `/request` form + migration 00022 backend already exist; needs extraction into a shared component and a 2-column homepage layout.
- Phone/WhatsApp field with flag + dial-code prefix — implies an intl-tel input component.

**Audience funnels & footer**
- For Buyers / For Sellers dual banners — pure UI, links to existing flows.
- 4-column footer (Quick Links/Resources/About/Support), social icons, "Upgrade to Premium" button, cream bottom strip — pure UI; premium links to existing `/pricing`.

## 🎨 Visual-language delta

- **Red is missing.** The design reserves red `#D8232A` for every conversion action (Search, Request Quote, Contact Supplier, Submit). The app's landing system is navy + **gold** (`landing-gold`) with essentially zero red — the single biggest brand divergence.
- **Photography vs abstraction.** The design leans on real commodity/logistics photos (hero collage, product shots, supplier logos). The app hero is an animated abstract backdrop and sections are typographic; only `landing-sectors` uses photos, in a different (large-card) treatment.
- **Density.** The design is compact and information-dense (12 chips, 6+6 cards, 8-field form, tight gutters). The app is airy marketing spacing — `landing-sectors` is even `min-h-screen` per section.
- **Flat vs polished.** Design: hairline borders, no shadows, ~8px radii. App: marketing-surface treatment with motion, larger radii, softer contrast.
- **Layout.** Design: 65/35 two-column with a persistent lead rail. App: single-column full-width stack.
- **Copy register.** Design is transactional B2B ("Request Quote", counts, "26 Provinces"); app is brand-narrative ("Your Gateway to Trusted Business…", "Invest in the DRC's strengths").

## 🔷 App features the design omits (regression watch-list)

- Signed-in hero state: personalized greeting + quick actions (My Companies, Submit a Request, My Requests, Inbox, Get Premium) — `hero-search-for-signed-in.tsx`.
- Admin-curated carousel (`carousel_slides`) and admin-curated featured-companies spotlight.
- Entity-tabbed global search with live results + search-appearance analytics (`home-search-panel.tsx`).
- Marketing narrative sections: About intro, Why DRC (cobalt/hydropower stats), Mission banner, How It Works, Value cards, Transform banner, Join CTA.
- 5-language availability claim / language switcher; alert ribbon; cookie consent (design shows none).
- Motion system (hero backdrop animation, section mounts per `docs/MOTION.md`).

## Verdict

**matchScore: 38/100**

The app's homepage is a search-forward *marketing* landing, while the design is a dense *marketplace* landing — same route, different species. The bones that match are partial: a navy hero with CTAs, a search surface (but single-input + tabs instead of the design's 4-facet bar), a verified-companies strip, and a sector section (6 investment photo-cards instead of 12 product-category chips). The design's core commerce furniture is absent from the homepage entirely: the 5-metric stats bar, the Featured Products grid with Request Quote actions, the persistent right-rail buying-request form (the form exists at `/request` but not here), the For Buyers/For Sellers funnels, and the 4-column footer with the Premium button. Visually, the app has drifted furthest on color — the design's red conversion language does not exist in the app, which uses gold — and on density, where the app's airy full-width sections contradict the design's compact 65/35 two-column grid.
