# Explore Companies by Sector (source: 9.ai)

## 1. Page identification & purpose

This is the **sector-based company directory landing page** — the "Explore Companies by Sector" screen under the **Local Contacts** section (breadcrumb reads `Home > Local Contacts > Explore by Sector`). It is a browse/discovery hub: instead of listing individual companies, it fans the directory out into six macro-sectors, each with live counts of companies and verified partners, plus a "Featured Sector" spotlight (Mining & Minerals) that drills one level deeper into sub-categories and pushes a lead-gen CTA ("Request a Verified Mining Partner"). Intent: make an international buyer feel the depth of the ecosystem ("416 companies, 312 verified partners") and funnel them either into a sector listing or straight into a partner-request flow.

Notable branding detail: the header/footer carry "Trade in DRC — Connect · Invest · Grow" plus a "Power by BrandsBridge Group" co-brand, and the URL shown is `www.tradeindrc.com`.

## 2. Layout & grid

Top-to-bottom section order (artboard ≈ 1100 × 826, landscape desktop):

1. **Utility bar** (~48 px, dark navy): logo left, "Power by BrandsBridge Group" right.
2. **Primary nav bar** (~35 px, white): 9 links left-aligned, two CTA buttons right (yellow + blue).
3. **Hero band** (~115 px, ~14% of height): dark-blue overlaid cityscape photo (Kinshasa skyline + river/bridge), left-aligned H1 + 3-line subcopy occupying roughly the left 40%.
4. **Breadcrumb strip** (~25 px) on the darker blue band beneath the hero.
5. **Sector grid**: 3 columns × 2 rows = **6 sector cards** on white, equal width (~300 px each), consistent ~15 px gutters, content area inset ~80 px from each artboard edge.
6. **Featured Sector module**: 2-part row — left ~1/3 is a full-bleed mining photo with a "Featured Sector" pill badge; right ~2/3 holds label + H2 + paragraph, a strip of **5 sub-category mini-cards**, and a full-width yellow CTA bar.
7. **Footer** (dark navy, ~110 px): logo + mission text (left), three link columns (Quick Links / Resources / Company), co-brand + 4 social icons (right), thin bottom bar with © line, tagline, URL.

Density is moderate-high (customer's preferred compact style): cards are information-dense (icon + title + 2-line description + two stats + button) but whitespace between cards keeps scanability. Everything is left-aligned inside cards; the grid itself is centered.

```
+--------------------------------------------------------------+
| [logo]  Connect·Invest·Grow            Power by BrandsBridge | dark navy
+--------------------------------------------------------------+
| Home Companies Opportunities Marketplace Local Contacts ...  |
|                          [Register Your Company][Request a   | white nav
|                                                  Partner]    |
+--------------------------------------------------------------+
| Explore Companies by Sector          ~~ city skyline photo ~~| hero (blue
| Discover local companies, service providers...               |  overlay)
|  Home > Local Contacts > Explore by Sector                   |
+--------------------------------------------------------------+
| [Mining&Minerals ] [Energy&Electric.] [Construction&Infra ]  |
|  icon title desc     icon title desc    icon title desc      |
|  416 | 312           289 | 214          358 | 276            |
|  [Explore Sector →]  [Explore Sector→] [Explore Sector →]    |
| [Logistics&Transp.] [Agriculture    ] [Digital,Telecom&Tech] |
|  198 | 143           276 | 203          142 | 108            |
+--------------------------------------------------------------+
| +-----------+  Featured Sector                               |
| | mining    |  MINING & MINERALS   (H2 + paragraph)          |
| | photo     |  [MiniCard][MiniCard][MiniCard][MiniCard][MC]  |
| |[Featured] |  [   🟡 Request a Verified Mining Partner → ]  |
| +-----------+                                                |
+--------------------------------------------------------------+
| footer: logo+blurb | Quick Links | Resources | Company | soc |
|  © 2024 ... | Connecting international business... | URL     |
+--------------------------------------------------------------+
```

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy blue | `#002B7A` – `#003087` | Utility bar, hero overlay, breadcrumb band, footer, "Explore Sector" outline buttons' text/border, dark "Featured Sector" badge |
| Primary blue | `#1A73E8` / `#1E6FD9` | "Request a Partner" button fill, active nav underline area, sector-card icons (line icons), link text, hero subcopy tint |
| Brand yellow | `#F5B700` – `#FFC20E` | "Register Your Company" button, "Connect · Invest · Grow" tagline dashes, hero H1 underline accent, active nav indicator, mining/featured icons, "Request a Verified Mining Partner" CTA bar, "Featured Sector" eyebrow label |
| White | `#FFFFFF` | Page/card backgrounds, hero H1, nav bar, button labels on blue |
| Off-white/light gray | `#F5F6F8` | Card fills / featured module background panel |
| Light gray border | `#DDE1E8` | Card strokes, mini-card strokes, dividers |
| Dark gray text | `#3A3F47` | Card body copy, stat labels |
| Near-black | `#1C2430` | Card titles |
| Green accent | `#3D9B35` (approx) | Agriculture card icon, "Grow" word in tagline |
| Red accent | `#CE1126` (in logo) | DRC map mark in logo, BrandsBridge logomark |
| Photo tones | earth ochres/greys | Mining photo (excavator + haul truck), city skyline |

**Brand logic:** the palette leans on the DRC flag — sky blue/deep blue + yellow with a touch of red (logo only) and green (agriculture/"Grow"). Blue = trust/institutional, yellow = action (every conversion CTA is yellow or blue), which matches the site's existing brand rules.

## 4. Typography

- **Single geometric/humanist sans family throughout** (looks like a rounded corporate grotesque — think Rubik/Nunito Sans/FS Emeric territory; the logo "Trade in DRC" uses a friendlier rounded cut).
- Hierarchy:
  - **H1 hero**: "Explore Companies by Sector" — ~34–36 px, Bold, white, Title Case, single line.
  - **Hero subcopy**: ~12–13 px, Regular, white/light-blue, 3 lines, sentence case.
  - **Card titles** ("Mining & Minerals"): ~15–16 px Bold, near-black, Title Case with ampersands.
  - **Card body**: ~10–11 px Regular, gray, 2–3 lines, sentence case.
  - **Stat numbers** ("416"): ~13 px Bold dark; **stat labels** ("Companies", "Verified Partners"): ~9 px Regular gray.
  - **Buttons**: ~11 px Semibold, Title Case ("Explore Sector", "Register Your Company").
  - **Featured eyebrow**: "Featured Sector" ~10 px Semibold yellow-orange, Title Case.
  - **Featured H2**: "Mining & Minerals" ~20–22 px Bold dark.
  - **Footer headings**: ~11 px Bold white; footer links ~10 px Regular light-gray/blue.
- No serifs, no all-caps blocks, generous line spacing in body text. Nav links ~11 px Medium, dark navy.

## 5. Components

- **Utility/top bar**: dark navy strip; left logo lockup (DRC map glyph in blue/red + "Trade in DRC" + tri-color tagline "Connect – Invest – Grow" in yellow/white/green); right "Power by" + BrandsBridge Group lockup.
- **Primary nav**: white bar; 9 text links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact); active item ("Market intelligence" area) has a **yellow underline indicator**. Right side: two pill-ish buttons — `Register Your Company` (yellow fill, navy text, ~4 px radius) and `Request a Partner` (blue fill, white text).
- **Hero**: photo band with left-to-right dark-blue gradient overlay (solid navy at left fading to reveal the skyline right); H1 + subparagraph; breadcrumb row below with arrow separators (`Home ▶ Local Contacts ▶ Explore by Sector`).
- **Sector card ×6**: white/very-light fill, 1 px light-gray border, ~6–8 px radius, no/faint shadow. Structure: top row = outline icon (left, ~48 px, blue or thematic color) + bold title (right of icon) + 2–3 line gray description under title; stats row = two icon+number+label pairs (circled check icons; "N Companies" / "N Verified Partners"); bottom = **outline button** "Explore Sector →" (1.5 px navy border, navy text, transparent fill, ~4 px radius, arrow glyph).
  - Cards: Mining & Minerals (416/312, yellow pickaxe icon), Energy & Electricity (289/214, bolt), Construction & Infrastructure (358/276, building/crane), Logistics & Transport (198/143, truck), Agriculture & Agro-Industry (276/203, green plant), Digital, Telecom & Technology (142/108, antenna).
- **Featured Sector module**: light panel; left photo block (square corners, edge-to-edge image) with bottom-left **dark badge pill** "◆ Featured Sector" (navy fill, white text, small radius); right column: yellow eyebrow "Featured Sector", H2, 3-line paragraph, then **5 sub-category mini-cards** (white, 1 px border, ~6 px radius, centered content: outline icon → 2-line bold label → count in small gray): Mining Equipment Suppliers (128), Safety Equipment Providers (86), Engineering Firms (94), Logistics for Mining (72), Laboratories & Testing Services (36). Below: **full-width yellow CTA bar** "🤝 Request a Verified Mining Partner →" (yellow fill, navy bold text, handshake icon, ~4 px radius).
- **Footer**: navy; logo + tagline + 3-line mission paragraph; three link columns — *Quick Links* (Companies, Opportunities, Products, Local Contacts), *Resources* (Market Intelligence, Promote Your Business, News & Insights, Help Center), *Company* (About Us, Terms of Use, Privacy Policy, Contact Us); right: BrandsBridge co-brand + 4 circular-outline social icons (LinkedIn, Twitter/X, YouTube, Email). Bottom bar separated by hairline: `© 2024 Trade in DRC. All rights reserved.` | `Trade in DRC – Connecting international business with local opportunities.` | `www.tradeindrc.com`.

## 6. Borders, radii, shadows & effects

- **Radius convention: small** — ~4 px on buttons, ~6–8 px on cards/mini-cards. No pill shapes except badge tendencies; corporate, crisp feel.
- **Strokes**: 1 px light-gray card borders; 1.5 px navy outline on "Explore Sector" buttons; hairline divider above footer bottom bar.
- **Shadows**: essentially none or extremely subtle — flat design; hierarchy comes from borders and fills, not elevation.
- **Gradients/overlays**: hero uses a navy→transparent horizontal gradient over the photo (text-protection scrim). Featured photo has slight bottom darkening under the badge.
- No glassmorphism, no blur effects, no heavy decoration. Flat institutional style.

## 7. Imagery & iconography

- **Hero photo**: Kinshasa skyline — high-rises, Congo River and a road/bridge with traffic, daylight; treated with dark-blue multiply/gradient overlay so white text sits on the left.
- **Featured photo**: open-pit mining scene — orange excavator loading a yellow haul truck, earth tones; unfiltered/full color, square-cropped block.
- **Icons**: consistent **outline (line) icon set**, ~2 px stroke, slightly rounded joins, mostly monochrome blue/navy with two thematic exceptions (yellow mining pickaxe, green agriculture leaves). Stat check-badges are thin circled checkmarks. Mini-card icons: mining cart, hard hat, gear, truck, lab flask. Social icons: thin circular outlines with glyphs.

## 8. Content & copy (all EN)

- H1: **"Explore Companies by Sector"**
- Hero sub: *"Discover local companies, service providers and potential partners operating in sectors that drive business and investment opportunities in the Democratic Republic of Congo."*
- Breadcrumb: Home / Local Contacts / Explore by Sector
- Card descriptions (examples): Mining — *"Discover mining companies, equipment suppliers, exploration firms and mineral processing specialists."*; Energy — *"Connect with power generators, energy service providers, EPC contractors and renewable energy specialists."*; Digital — *"Connect with ICT companies, telecom operators, software developers and technology solution providers."*
- Featured paragraph: *"The DRC is one of the world's most mineral-rich countries, with vast reserves of copper, cobalt, gold, diamonds and more. Our verified mining sector partners support the entire value chain from exploration and extraction to processing and export."*
- CTAs: "Register Your Company", "Request a Partner", "Explore Sector", "Request a Verified Mining Partner".
- Footer tagline: *"Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo."*
- Tone: confident, institutional, benefit-led, verification-heavy ("verified" appears 5+ times). English only in mockup; FR translation required for production.

## 9. UX assessment

**Works well**
- Crystal-clear hierarchy: hero states the job, six equal cards invite comparison, featured module deepens engagement, one loud yellow CTA closes.
- Stats ("416 Companies / 312 Verified Partners") are strong social proof and differentiate this from a generic category grid.
- Consistent card anatomy = excellent scanability; outline "Explore Sector" buttons don't compete with the primary yellow conversion CTA.
- Verification framing supports the trust mission of a government-backed portal.

**Risks**
- Hero subcopy at ~12 px white-on-photo may fall below contrast/readability thresholds where the overlay thins (right side is protected, left is fine).
- Card body text ~10 px and stat labels ~9 px are below comfortable minimums — bump to 13–14 px / 12 px on web.
- Six "Explore Sector" buttons + one giant yellow bar risks CTA dilution; on mobile the featured CTA must remain above-the-fold-adjacent.
- Counts must be live data, not hardcoded, or they become an instant credibility liability.
- Nav has 8+ items plus 2 buttons — tight at laptop widths; needs an overflow/mega-menu strategy.
- Only 6 sectors shown; the taxonomy has more — needs a "View all sectors" escape hatch.
- "Power by" is a typo → "Powered by".

## 10. Mapping to TradeInDRC site

- **Route**: maps to `/[locale]/sectors` (existing sectors index) or a new `/[locale]/local-contacts/sectors` browse page; sector card CTA → `/companies?sector=<slug>`; featured CTA → the existing **Request page** (`/request`, per 2026-06-04 customer batch) pre-filled with sector = mining.
- **Data**: sector cards from `sectors` table + aggregate counts (`companies` count, verified count via `verification_tier`) — compute server-side; sub-category mini-cards from `categories` filtered by sector. Counts should come from a cached server query, not client Firestore-style polling.
- **Implementation notes (Tailwind/shadcn)**:
  - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`; cards = shadcn `Card` with `rounded-lg border bg-card` (no shadow), compact padding per the customer's density preference.
  - Buttons: yellow = `bg-[#F5B700] text-[#002B7A]` variant; outline = `variant="outline"` with navy border; keep 4–8 px radii (matches `--radius` small).
  - Hero: reuse existing page-hero pattern with `bg-gradient-to-r from-[#002B7A] via-[#002B7A]/80 to-transparent` scrim over image; breadcrumb via shadcn `Breadcrumb`.
  - Stats row: lucide `BadgeCheck` icons; sector icons via lucide (`Pickaxe`, `Zap`, `Building2`, `Truck`, `Sprout`, `RadioTower`).
  - Featured module: `grid lg:grid-cols-[1fr_2fr]`; mini-cards as a 5-col strip collapsing to 2–3 cols on mobile; CTA bar full-width `Button size="lg"` yellow.
  - i18n: all strings through next-intl (`en`/`fr`); sector names already bilingual in taxonomy.
  - Motion: per MOTION.md — restraint; card hover lift ≤180 ms border/translate, staggered mount ≤300 ms for the grid; no parallax on hero.
  - A11y: raise body copy to `text-sm`, ensure 4.5:1 on hero subcopy, `aria-label`s on the six identical "Explore Sector" buttons (append sector name).
