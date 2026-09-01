# Verified Companies Directory (source: 7.ai)

## 1. Page identification & purpose

This is the **Verified Companies Directory** page — a filtered company-listing page whose whole angle is *trust*. The breadcrumb reads "Home > Local Contacts Directory > verified companies directory", so it is a sub-page of a "Local Contacts" module, not the generic companies index. Its job:

- Explain the platform's **verification badge tiers** (Registered / Verified / Premium Verified Local Partner).
- Let international buyers **filter and search** verified Congolese companies by sector, province, partnership type, premium status and "international business ready".
- Present a **card grid of verified companies** with badges and "View Profile" CTAs.
- Close with a **"Our Verification Approach"** 5-step process strip that justifies why the badges can be trusted.

Notably, the header brands the site as "Trade in DRC — Connect · Invest · Grow" and is "Powered by BrandsBridge Group" — a co-brand block repeated in the footer. Language is entirely **English**.

## 2. Layout & grid

Single centered content column (~92% of artboard width) over full-bleed bands. Section order top-to-bottom:

1. White utility bar (logo left, "Power by BrandsBridge Group" right)
2. Dark navy primary nav bar (8 links left, 2 pill CTAs right — yellow + blue)
3. Thin breadcrumb bar (dark)
4. Hero band: navy gradient over a Kinshasa/Congo-river cityscape photo, left-aligned title + two lines of supporting copy; photo fades in from the right half
5. **Verification badges explainer card** — one white rounded card overlapping the hero bottom edge, tab-like centered label "Understanding Our Verification Badges", 3 equal columns separated by vertical hairlines
6. **Filter bar** — one white rounded strip: search icon + 3 dropdowns (Sector / Province / Type of partnership) + 2 toggle switches (Premium Only, International Business Ready) + red "Search Companies →" button at far right
7. Results meta row: "Showing 1–12 of 284 verified companies" left, "Sort by: Recently Added" select right
8. **Company card grid** — 4 columns × 2 rows (8 cards visible), equal-height white cards
9. **"Our Verification Approach"** white card — 5 icon steps connected by dashed arrows, horizontal
10. Footer: navy, 4 link columns + brand block left + BrandsBridge logo & social icons right; sub-bar with copyright, tagline, URL

```
[logo]                                [Powered by BrandsBridge]
[Home Companies Opportunities … Contact] [Register][Request]
[breadcrumb ..............................................]
+---------------------------------------------------------+
| HERO  navy→photo    Verified Companies Directory        |
|                     subcopy (2 lines)                   |
|   +--[ Understanding Our Verification Badges ]-------+  |
|   | [🛡 Registered] | [✔ Verified] | [🏅 Premium ]   |  |
+---+--------------------------------------------------+--+
| [🔍|Sector v|Province v|Type v| Premium ◯ | Intl ◯ |[Search→]]
| Showing 1-12 of 284             Sort by: Recently Added |
| [card][card][card][card]                                |
| [card][card][card][card]                                |
| +--------- Our Verification Approach ----------------+  |
| | ①→②→③→④→⑤  (dashed connectors)                    |  |
| +----------------------------------------------------+  |
| FOOTER (navy, 4 col + brand + social)                   |
+---------------------------------------------------------+
```

Density is high but disciplined: consistent ~24px gutters between cards, generous internal card padding, whitespace concentrated inside white cards while page background bands (light gray `#F1F4F8`-ish) do the section separation.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#0B2A4A` / `#0D3057` | Nav bar, hero background, footer, step numbers |
| Mid brand blue | `#1B75BB` | "Request a Partner" outline pill, links, icons, "View Profile" buttons, footer accents |
| Light sky blue | `#4FA3E0` | Logo gradient, hero photo tint, icon accents |
| Red | `#D62E2E` / `#C8102E` | "Search Companies" primary button — the only red on the page |
| Yellow/gold | `#F5B21A` / `#FFC20E` | "Register Your Company" CTA, Premium Partner badge/crown, premium card icons, "Verified Companies" active footer link, hero underline accent |
| Green | `#2E9E4F` | "Verified" check badges (card corner checks, badge pills, explainer shield) |
| White | `#FFFFFF` | Cards, filter bar, explainer, top utility bar |
| Page gray | `#F0F3F7` | Body background between white cards |
| Dark text | `#1E2A3A` | Headings on white |
| Muted gray text | `#6B7688` | Card descriptions, meta text |
| Pale blue chip | `#E8F1FA` | Icon circles inside cards |

Brand logic: this is **not** strictly DRC-flag branding — it is a blue-led corporate trust palette (navy + brand blue) with the DRC flag's **yellow** and **red** reserved for CTAs (yellow = register, red = search) and premium accents. Green is functional (verification = green check), not national.

## 4. Typography

- One geometric-humanist **sans-serif** family throughout (reads like Montserrat/Poppins/Segoe-class).
- Hero H1 "Verified Companies Directory": bold/700, white, ~40–44px equivalent, sentence-title case.
- Section titles ("Understanding Our Verification Badges", "Our Verification Approach"): bold, ~18–20px, dark navy, centered, with a short yellow/blue underline rule beneath.
- Card company names: semibold ~15px, navy, two-line wrap allowed.
- Category line under company name: medium ~12px, blue.
- Body/description text: regular ~11–12px, muted gray, 2–3 line clamp.
- Badge pills and buttons: ~11px semibold.
- Nav links: ~13px medium, white, title case. Breadcrumb is small (~11px) white.
- Numbered step titles: bold ~12px ("1. Documents Submitted"), sub-copy regular ~10–11px gray.
- Casing is consistently Title Case for headings/labels except the lowercase breadcrumb leaf ("verified companies directory" — an inconsistency).

## 5. Components

1. **Utility bar**: white, logo lockup left ("Trade in DRC" with blue mark + tagline "Connect · Invest · Grow" in orange/yellow), "Power by" + BrandsBridge Group lockup right.
2. **Primary nav**: navy bar; links Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact. Two rounded-pill CTAs: solid yellow "Register Your Company" (navy text) and outlined/filled blue "Request a Partner" (white text). Radius ~999px (full pill).
3. **Breadcrumb bar**: darker navy strip, small white crumbs with arrow separators; active tab indicator (yellow underline block appears at right side of the strip under the hero photo edge).
4. **Hero**: ~260px tall band, navy-to-photo horizontal blend; H1 + 2-line subcopy, last words "with confidence." underlined for emphasis. No hero CTA — the filter bar below is the action.
5. **Verification badges explainer card**: white, radius ~14px, soft shadow, centered "tab" title chip breaking the top border. Three columns, each: shield/medal icon in outlined circle (blue, green, gold), bold title, 2-line gray description, small tinted pill underneath ("Basic Profile" gray, "Verified" green, "Premium Partner" gold). Vertical hairline dividers between columns.
6. **Filter bar**: white rounded strip (~radius 12px, shadow). Left→right: search magnifier icon; three labeled dropdowns each with leading icon, small gray label ("Select a sector") over bold value ("All Sectors") and chevron, separated by hairlines; two toggle-switch filters with icons (star = "Premium Only", globe = "International Business Ready"); solid **red** "Search Companies →" button (radius ~8px).
7. **Company cards** (8 shown, 4-col grid): white, radius ~12px, 1px light border + subtle shadow. Structure: top row = circular logo/monogram (56px, thin gray ring) left, company name + verification icon (green check or gold crown for premium) right of it; blue category line ("Mining & Minerals", "Agriculture & Agro-Industry"…); location line with pin icon ("Lubumbashi, Haut-Katanga"); 2–3 line gray description; divider; footer row = left badge pill (green "✔ Verified" or gold "Premium Partner") and right navy "View Profile →" small rounded button. Cards: Katanga Industrial Supply SARL (premium), Agro Futur SARL, Congo Energy Solutions SA, Digital Telecom DRC SARL (premium), Vert Congo SARL, BuildTech DRC SA, Congo Logistics Group SARL, MedCare DRC SARL.
8. **Results meta row**: plain text count + bordered "Sort by" select (white, radius 6px).
9. **Verification approach stepper**: white card, 5 steps; each = thin blue outlined circle (~56px) containing a line icon (document, phone, checklist doc, map pin, shield-check), numbered bold title, 2-line gray caption; steps joined by **dashed arrows**.
10. **Footer**: navy; left = logo + tagline + 2-line mission paragraph; columns "Quick Links" (Companies, Opportunities, Products, Local Contacts, **Verified Companies** highlighted yellow), "Resources" (Market Intelligence, Promote Your Business, News & Insights, Help Center), "Company" (About Us, Terms of Use, Privacy Policy, Contact Us); right = "Power by" BrandsBridge lockup + 4 circular outline social icons (LinkedIn, Twitter/X, YouTube, mail). Sub-bar: "© 2024 Trade in DRC. All rights reserved." | "Trade in DRC – Connecting international business with local opportunities." | "www.tradeindrc.com".

## 6. Borders, radii, shadows & effects

- Radius scale: full-pill nav CTAs; ~12–14px cards/filter/explainer; ~6–8px buttons and selects; circles for logos/step icons/social.
- Strokes: 1px light gray (`#E3E8EF`) card borders and hairline dividers; 1.5–2px blue outline circles for step icons and logo rings.
- Shadows: very soft, low-spread drop shadows on all white cards (`0 2px 8px rgba(13,48,87,.08)` feel) — flat-modern, no heavy elevation.
- Gradients: hero navy→transparent left-to-right over photo; logo mark uses a blue gradient. No glassmorphism.
- Dashed-line connectors with arrowheads in the process stepper.
- The explainer card's title sits as a **notched tab** breaking its top border — a distinctive detail.
- Yellow underline accent under key phrase "with confidence." in hero copy.

## 7. Imagery & iconography

- **One photo**: hero background — Congo River / Kinshasa skyline with bridge and high-rises, cool blue tint, blended under a navy overlay that guarantees left-side text legibility; fades to near-invisible at far left.
- **Company "logos"** are illustrative monograms/icons in circles: yellow abstract A-mark, green "AGRO FUTUR" roundel, blue lightning bolt, "dt" wordmark, green leaf, orange bar-chart buildings, blue ship, green medical cross. Flat, colorful, in white circles with thin rings.
- **Icon style**: consistent thin-to-medium **line icons** with rounded terminals (shields, medal, magnifier, pin, phone, document, globe, star). Verification marks are **filled** shields/checks (green) and a filled gold medal/crown for premium. Social icons are filled glyphs in outlined circles.

## 8. Content & copy (verbatim highlights, EN)

- H1: "Verified Companies Directory"
- Sub: "Connect with reviewed and verified business profiles in the DRC." / "Every company listed here has been reviewed for legitimacy, credibility and business activity to help you build trusted partnerships with confidence."
- Badge tiers: "Registered Company — Company has registered on the platform and provided basic business information."; "Verified Company — Company has been reviewed and verified for legitimacy and business activity."; "Premium Verified Local Partner — High-trust local partner with deeper verification and proven track record."
- Filters: "Select a sector / All Sectors", "Select a province / All Provinces", "Type of partnership / All Types", "Premium Only", "International Business Ready", "Search Companies"
- Meta: "Showing 1–12 of 284 verified companies", "Sort by: Recently Added"
- Steps: "1. Documents Submitted", "2. Official Contact Confirmed", "3. Documentation Reviewed", "4. Sector & Location Classified", "5. Profile Published"
- Tone: institutional, reassurance-driven ("reviewed", "verified", "trusted", "confidence") — selling credibility more than discovery. Note typos in source: "Power by" (should be "Powered by"), lowercase breadcrumb leaf.

## 9. UX assessment

**Works well**
- Trust narrative is coherent: badge explainer → badged results → process proof. Excellent for a market where counterparty risk is the #1 buyer objection.
- Filter bar is the de-facto hero CTA; red button pops against an otherwise blue page (single-use red = strong affordance).
- Cards are uniform and scannable: logo, name, sector, location, blurb, badge, CTA — a clean F-pattern.
- Color-coded tier system (gray/green/gold) is instantly learnable.

**Risks**
- Grid says "Showing 1–12" but only 8 cards are drawn — spec mismatch to resolve (12 = 4×3).
- 4-across cards with 2–3-line descriptions get cramped below ~1280px; needs 4→3→2→1 responsive collapse.
- Toggle labels ("International Business Ready") are long; on smaller widths the single-row filter bar will overflow — plan a wrap or a collapsed "Filters" sheet.
- Contrast: 11px muted-gray body text on white is borderline (< 4.5:1 risk); yellow-on-white "Premium Partner" pills and gold crown icons will fail contrast — use darker amber text `#8a6100`-class on tinted chip.
- Hero text over photo is safe only because of the overlay; enforce the gradient in code, don't rely on the image.
- "Power by" typo; breadcrumb casing inconsistency; footer "Verified Companies" highlighted yellow is a nice current-page cue but must be systematic.
- No pagination control drawn — must be added (284 results).
- Two nav CTAs (Register + Request a Partner) compete; acceptable but keep visual weight yellow > blue as drawn.

## 10. Mapping to TradeInDRC site

- **Route**: extends the existing `/[locale]/companies` directory; best implemented as `/[locale]/companies?verified=true` view or a dedicated `/[locale]/local-contacts/verified` page under a new "Local Contacts" section (breadcrumb implies the latter). Reuses `companies`, `sectors` tables; verification tier maps to the existing `VerificationTier` constant in `constants/status` (T1 dedup already done — align the 3 mockup tiers: registered/verified/premium with it).
- **Nav**: mockup nav (Marketplace, Local Contacts, Market intelligence, Promote Your Business) diverges from current `NAVIGATION_CONFIG` — treat as customer's desired IA; reconcile before build.
- **Implementation notes (Tailwind/shadcn)**:
  - Badge explainer = single `Card` with `grid-cols-3 divide-x`; title chip via absolutely-positioned `-top-3` pill.
  - Filter bar = `Card` wrapping shadcn `Select` ×3 + `Switch` ×2 + `Button variant="destructive"` (map red to a `--search-cta` token, don't reuse semantic destructive site-wide).
  - Company card = existing company-card component extended with tier badge (`Badge` variants: `verified` green, `premium` amber) and `View Profile` `Button size="sm"` linking `/companies/[id]`.
  - Stepper = flex row with dashed `border-t border-dashed` connectors or an SVG; collapse to vertical on mobile.
  - Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`; add shadcn `Pagination`.
  - Server-side filtering via Supabase query params (sector, province, tier, sort); counts from a `count: 'exact'` head query.
  - i18n: all strings through next-intl (EN/FR) — mockup is EN-only; FR strings needed for every label including tier names.
  - Motion per `docs/MOTION.md`: card hover lift ≤180ms, staggered grid mount ≤300ms, no scroll-triggered stepper animation beyond a subtle fade.
  - Bilingual columns for company descriptions already exist per migration conventions; badge tier must come from `companies.verification_tier` (or profiles) with RLS-safe public read.
