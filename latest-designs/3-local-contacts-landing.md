# Local Contacts Landing Page (source: 3.ai)

## 1. Page identification & purpose

This is the **"Local Contacts" landing / directory-entry page** — a dedicated marketing-led search page for finding verified local business contacts in the DRC. Evidence: hero headline "Find Trusted Local Business Contacts in the Democratic Republic of Congo", the nav item "Local Contacts" being the surface this page serves, the contact-type card row ("What Type of Local Contact Are You Looking For?"), and the CTA band "Entering the DRC Market? Start with the Right Local Contact."

Role in the site: the top of the funnel for the matchmaking feature. It serves two audiences symmetrically:
- **International buyers/investors** → "Request a Local Partner" (find suppliers, distributors, representatives).
- **Congolese businesses/individuals** → "Register as a Local Contact" (get listed).

It is a search-forward landing page (search bar in the hero), consistent with the customer's earlier request for a "search-forward home", but scoped to the contacts vertical rather than the whole portal.

## 2. Layout & grid

Landscape desktop artboard (~1440×1080 proportions, 4:3-ish). Full-width sections stacked; inner content on a centered container (~86% width). Density is moderate-high: six-column card rows, tight card padding, generous section headings. Whitespace strategy: white page background between a dark-navy header block and dark-navy footer, so the page reads as "dark frame, light body".

Top-to-bottom section order:

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR (navy): logo "Trade in DRC / Connect–invest–Grow"     │
│                                  Power by ◆ BrandsBridge Grp │
├──────────────────────────────────────────────────────────────┤
│ NAVBAR (navy): Home Companies Opportunities Marketplace      │
│ Local Contacts Market intelligence Promote… Contact          │
│                 [Register Your Company][Request a Partner]   │
├──────────────────────────────────────────────────────────────┤
│ HERO (photo: Kinshasa skyline + bridge, dark overlay left)   │
│  H1 "Find Trusted Local Business Contacts …"                 │
│  sub-line (2 lines)                                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔍 keywords | Select a sector ▾ | Select a province ▾  │  │
│  │  | Type of contact ▾ | [Search contacts →] (red)       │  │
│  └────────────────────────────────────────────────────────┘  │
│  [Request a Local Partner] [⎔ Register as a Local Contact]   │
├──────────────────────────────────────────────────────────────┤
│ "What Type of Local Contact Are You Looking For?"            │
│ [Suppliers][Distributors][Local Reps][Service Providers]     │
│ [Institutional Contacts][Investment Partners]   (6 cards)    │
├──────────────────────────────────────────────────────────────┤
│ "Explore Local Contacts by Strategic Sector"                 │
│ [Mining][Energy][Construction][Agri][Logistics][Digital]     │
│  each: icon + name + "N Companies" + [Explore Sector]  (6)   │
├──────────────────────────────────────────────────────────────┤
│ VALUE STRIP (light grey band, 3 columns):                    │
│  ◎ Discover   |   🛡 Verify   |   👥 Connect                 │
├──────────────────────────────────────────────────────────────┤
│ CTA BAND (navy, rounded): "Entering the DRC Market? …"       │
│                       [🤝 Request a Local Partner →] (yellow)│
│                                     Africa-map motif (right) │
├──────────────────────────────────────────────────────────────┤
│ FOOTER (navy): logo+blurb | Quick Links | Resources |        │
│  Company | Power by BrandsBridge + 4 social icons            │
│  bottom bar: © 2024 … | tagline | www.tradeindrc.com         │
└──────────────────────────────────────────────────────────────┘
```

- Hero occupies ~30% of page height; search bar overlaps its lower third and slightly breaks below the photo edge.
- Both card rows use a strict **6-column grid**, equal-width cards, ~16–20px gutters.
- Value strip is 3 equal columns; footer is a 5-zone grid (brand block wider, 3 link columns, social block).

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy blue | `#0A2A5C` / `#0B2E63` | Topbar, navbar, CTA band, footer, sector card icon accents, "Explore Sector" pill buttons, headings on cards |
| Bright/golden yellow | `#F5A800`–`#FFC20E` | "Register Your Company" nav CTA, "Request a Local Partner" hero + band CTAs, logo tagline "Grow", yellow icon accents (Mining pickaxe, Connect figures) |
| Red | `#D6232A` / `#E02020` | "Search contacts" submit button, red accents in logo mark and DRC-flag motif |
| Royal/medium blue | `#1E63D0` / `#2F6FE0` | "Request a Partner" nav button, icon strokes (Distributors truck, Institutional bank, Telecom signal), links |
| White | `#FFFFFF` | Body background, search bar field, card backgrounds, hero H1 text, nav labels |
| Off-white / light grey | `#F4F6F9` | Value strip band, card hover tint, input placeholder zones |
| Light grey border | `#E2E6EC` | Card borders, search-field dividers |
| Dark text | `#1A2233` | Card labels, section headings on white |
| Muted grey text | `#6B7280` | Placeholders, sub-copy, "N Companies" counts |
| Green accent | `#3FA34D` | Agriculture leaf icon accent |
| Orange accent | `#E8821A` | Construction crane icon accent |

**Brand logic:** deliberately built on the **DRC flag palette — sky blue/navy, yellow, red** (flag blue field, yellow star/stripe, red stripe). Navy is the structural brand color; yellow is the primary CTA color; red is reserved for the single highest-intent action (search submit). Secondary blue handles neutral/secondary actions.

## 4. Typography

- Single **geometric/neo-grotesque sans-serif** family throughout (Montserrat/Poppins-like: round bowls, uniform stroke).
- Hero H1: **ExtraBold/Black**, Title Case, white, ~44–52px equivalent, tight leading over 4 lines.
- Section headings ("What Type of Local Contact…", "Explore Local Contacts by Strategic Sector"): Bold, ~24–28px, dark navy/near-black, centered.
- Card labels: SemiBold ~14–15px, dark, centered, two-line wraps allowed ("Local Representatives", "Agriculture & Agro-Industry").
- Meta ("416 Companies"): Regular ~12px, muted grey.
- Buttons: SemiBold ~13–15px, sentence/title case; small pill buttons ("Explore Sector") ~11–12px.
- Nav links: Medium ~13–14px, white, title case.
- Footer link columns: heading SemiBold white, links Regular ~12–13px, lighter blue-grey.
- No serif, no italics, no all-caps tracking treatments — hierarchy is carried entirely by weight + size + color.

## 5. Components

- **Topbar** (navy, ~56px): left logo lockup (DRC-map mark in blue/red + "Trade in DRC" + yellow/blue tagline "Connect – invest – Grow"); right "Power by" + BrandsBridge diamond logo. Flat, no border.
- **Navbar** (navy, ~48px): 8 text links left-aligned; right pair of buttons — yellow filled rounded-rect "Register Your Company" (navy text) and medium-blue filled "Request a Partner" (white text). Radius ~6–8px.
- **Hero**: full-bleed photo (Kinshasa skyline/bridge over Congo River), dark navy-to-transparent gradient overlay from left; H1 + 2-line subtext left-aligned.
- **Search bar** (signature component): single white rounded bar (~radius 8px, soft drop shadow) split into 4 fields by thin vertical dividers — keyword input with magnifier icon, 3 dropdowns with chevrons ("Select a sector", "Select a province", "Type of contact") — ending in a full-height **red** "Search contacts →" button (square-ish right cap, radius on outer corner only).
- **Hero secondary CTAs** below the bar: yellow filled "Request a Local Partner" + white-outlined transparent "Register as a Local Contact" with person icon (2px white stroke, radius ~8px).
- **Contact-type cards** (×6): white, 1px light-grey border, radius ~8px, minimal/no shadow; centered line-style icon (~48px, navy stroke with one colored accent) + SemiBold label. No CTA — whole card is the affordance.
- **Sector cards** (×6): same shell; icon + sector name (SemiBold) + "N Companies" count + small navy pill button "Explore Sector" (white text, full pill radius ~14px). Counts visible: Mining 416, Energy 269, Construction 358, Agriculture 276, Logistics 198, Digital 142.
- **Value strip**: light-grey full-width band, 3 columns, each = icon (~44px, navy/yellow duotone) + Bold title (Discover / Verify / Connect) + 2-line grey description. Left-aligned icon-beside-text layout.
- **CTA band**: inset navy rounded rectangle (radius ~12px) spanning container width; left Bold white headline + lighter subline; right yellow filled button "Request a Local Partner →" with handshake icon; faint yellow Africa-continent map graphic on far right.
- **Footer** (navy): brand block with logo + 3-line mission blurb; three link columns (Quick Links: Companies, Opportunities, Products, Local Contacts · Resources: Market Intelligence, Promote Your Business, News & Insights, Help Center · Company: About Us, Terms of Use, Privacy Policy, Contact Us); "Power by BrandsBridge" + 4 circular-outline social icons (LinkedIn, Twitter, YouTube, Email). Bottom bar in slightly darker navy: © left, centered tagline, URL right.

## 6. Borders, radii, shadows & effects

- **Radius system:** ~8px on cards, inputs, buttons, search bar; ~12px on the CTA band; full pill only on "Explore Sector" mini-buttons; circles for social icons. Consistent, restrained.
- **Borders:** 1px `#E2E6EC` on white cards; 2px white outline on the hero ghost button; hairline vertical dividers inside the search bar.
- **Shadows:** only the search bar carries a visible soft drop shadow (to float it over the hero edge); cards are effectively flat. No glassmorphism.
- **Gradients/overlays:** hero photo uses a left-anchored dark navy gradient overlay (~70%→0%) for text legibility; CTA band may have a subtle navy radial. Otherwise flat fills.
- **Dividers:** section separation via background-color changes (white → grey strip → white → navy band), not rules.

## 7. Imagery & iconography

- **Hero photo:** aerial view of Kinshasa — modern high-rise, river, long bridge/expressway with traffic. Realistic color photo, darkened on the left by the gradient overlay; conveys "modern, investable DRC".
- **Africa map motif:** faint yellow outline/fill of the African continent with DRC highlighted, right side of the CTA band — decorative watermark.
- **Logo mark:** stylized DRC map/flag shape in blue with red-and-yellow diagonal accents.
- **Icon style:** consistent **duotone line icons** (~2px stroke): navy primary stroke + one flat color accent (yellow, red, green, orange, blue) per icon. Subjects: stacked boxes (Suppliers), delivery truck (Distributors), headset person (Local Representatives), gear/hand (Service Providers), bank columns (Institutional), globe+handshake (Investment Partners); pickaxe/minerals, lightning bolt, crane+building, leaf/sprout, truck, radio-signal tower for sectors; target/scan (Discover), shield-check (Verify), two people (Connect).
- Social icons: white line icons in thin circular outlines.

## 8. Content & copy

Language: **English only** in this mockup (FR version implied by the bilingual site).

Key strings (transcribed):
- H1: "Find Trusted Local Business Contacts in the Democratic Republic of Congo"
- Hero sub: "Connect with verified suppliers, distributors, representatives, service providers and institutional contacts across the DRC."
- Search placeholders: "Enter keywords, company name product or service" / "Select a sector" / "Select a province" / "Type of contact" / button "Search contacts"
- CTAs: "Request a Local Partner", "Register as a Local Contact", "Register Your Company", "Request a Partner"
- Section heads: "What Type of Local Contact Are You Looking For?" / "Explore Local Contacts by Strategic Sector"
- Value props: "Discover — Easily find local contacts across provinces and sectors with advanced search and smart filters." / "Verify — All contacts are verified for legitimacy, credibility and business activity." / "Connect — Connect directly and build trusted relationships that drive real business outcomes."
- CTA band: "Entering the DRC Market? Start with the Right Local Contact." + "Request a local partner to get market insights, introductions and on-the-ground support."
- Footer tagline: "Trade in DRC — Connecting international business with local opportunities." · "© 2024 Trade in DRC. All rights reserved." · "www.tradeindrc.com"
- Tagline: "Connect – invest – Grow" (note lowercase "invest" — likely a typo to normalize).
- Attribution: "Power by BrandsBridge Group" (sic — should be "Powered by").

Tone: confident, trust-centric B2B marketing ("Trusted", "verified", "credibility"). Copy typos to fix in implementation: "Power by", "Comparies" (extraction artifact), lowercase "invest".

## 9. UX assessment

**Works well**
- Crystal-clear funnel: search → browse by type → browse by sector → trust proof → single CTA. Hierarchy is textbook.
- The 4-field faceted search in the hero is the strongest element — it matches real user intent (sector + province + contact type) and the red submit button is unmissable.
- Dual-CTA discipline: yellow = demand side, outline/blue = supply side, consistently repeated (hero, navbar, band).
- Company counts on sector cards act as social proof and set expectations.
- Discover/Verify/Connect strip communicates the trust mechanism, critical for a government/DRC-market context.

**Risks / concerns**
- **Text-on-image contrast:** the H1's right edge and sub-copy sit near lighter photo areas; the gradient overlay must be strong enough (aim WCAG AA 4.5:1; consider a solid scrim panel on mobile).
- **Yellow buttons with white/navy text:** yellow `#F5A800` + white text fails contrast; must use navy text on yellow everywhere (the mock mostly does — enforce it).
- Six-column card rows collapse poorly — need explicit 6→3→2 responsive breakpoints; labels like "Agriculture & Agro-Industry" will wrap unevenly.
- Three color-coded button meanings (yellow/blue/red) risk diluting; keep red exclusively for search submit.
- "Explore Sector" pill at ~11px is below comfortable tap size — enlarge hit area to ≥44px.
- Company counts must be live data, not hardcoded, or they erode trust.
- "Power by BrandsBridge" copy error and mixed-case tagline need editorial cleanup before build.

## 10. Mapping to TradeInDRC site

**Route:** a new `/[locale]/local-contacts` landing page (the design's own nav confirms "Local Contacts" as a primary destination). The search submits into a results view — either `/local-contacts?sector=&province=&type=&q=` on the same route or reusing the companies directory with a `contact_type` facet. Secondary flows: "Request a Local Partner" → existing request page (customer-batch 2026-06-04 migration 00022); "Register as a Local Contact" → auth modal → dashboard company/contact onboarding.

**Data model implications:** needs a `contact_type` taxonomy (supplier / distributor / local_representative / service_provider / institutional / investment_partner) on `companies` or a new `local_contacts` table, plus a `provinces` reference table for the province filter. Sector cards read live counts from `sectors` (BigQuery/aggregate or a cached count column — do not hardcode 416/269/etc.).

**Implementation notes (Tailwind/shadcn):**
- Header/footer: extend the existing Navbar/Footer with the navy theme tokens; nav CTAs = `Button` variants (`bg-amber-400 text-blue-950`, `bg-blue-600 text-white`).
- Hero: `relative` section, `next/image` Kinshasa photo, `bg-gradient-to-r from-blue-950/85 via-blue-950/50 to-transparent` overlay.
- Search bar: one `rounded-lg bg-white shadow-lg` flex container; keyword `Input` (borderless) + three shadcn `Select`s separated by `divide-x divide-slate-200`; red submit `Button` (`bg-red-600`) with `ArrowRight`. Collapse to stacked full-width fields under `md:`.
- Card rows: `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4`; shadcn `Card` with `border rounded-lg hover:shadow-sm hover:-translate-y-0.5 transition duration-150` (respect MOTION.md ≤180ms hover rule).
- Icons: Lucide (`Boxes`, `Truck`, `Headset`, `Landmark`, `Handshake`, `Pickaxe`, `Zap`, `Construction`, `Sprout`, `RadioTower`) with navy stroke + accent color per card.
- Value strip: `bg-slate-100` band, 3-col grid.
- CTA band: `bg-blue-950 rounded-xl` container with yellow `Button` and a low-opacity Africa SVG absolutely positioned right.
- i18n: all strings via next-intl keys under a new `localContacts` namespace (EN + FR); fix "Powered by" and "Connect – Invest – Grow" casing.
- Note palette tension: this mock's navy/yellow/red DRC-flag scheme should be reconciled with existing brand tokens in `globals.css` before build (memory: light theme, brand-color CTAs, compact cards — this design complies).
