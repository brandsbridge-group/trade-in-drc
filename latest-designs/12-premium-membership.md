# Premium Membership / Premium Local Partner Page (source: 12.ai)

## 1. Page identification & purpose

This is the **Premium Membership sales page** ("Become a Premium Local Partner and Grow Internationally"). It is a conversion-focused pricing/upsell page aimed at **Congolese local companies** (the supply side of the marketplace): it sells the USD 3,000/year "Premium Local Partner" tier, compares it against "Free Listing" and "Verified Company (One-time Fee)", explains the benefits, walks through the 4-step application flow, and closes with a support CTA. Its role in the site is monetization — converting free directory listings into paid, verified, high-visibility profiles. Design intent: authoritative, corporate, trust-building (comparison table + verification steps), with a single dominant red CTA driving the application.

## 2. Layout & grid

Single desktop artboard, ~1170 px wide, roughly 830 px tall as drawn. Top-to-bottom section order:

1. **Top utility bar** (dark navy, ~50 px): logo left, "Power by BrandsBridge Group" right.
2. **Nav bar** (white, ~35 px): 9 links left, 2 pill CTAs right (yellow + blue).
3. **Hero band** (~305 px, full-bleed photo with dark navy overlay): two-column split — left ~45% headline + subcopy + price + red CTA; right ~40% a floating white **Compare Membership Plans** card (4-column feature matrix, 13 feature rows) overlapping the photo, top-aligned near the nav.
4. **Benefits strip** (white, ~75 px): 6 equal columns, icon + bold title + 2-line caption each, hairline card border around the whole strip.
5. **Two-panel section** (~175 px): left card ~55% "What You Get as a Premium Local Partner" (6 green-check bullets); right card ~45% "How It Works" (4 numbered steps in a horizontal row with arrow connectors).
6. **Assistance banner** (~45 px, dark navy, rounded): headset icon + "Need Assistance?" copy left, outlined "Book a Call" button right.
7. **Footer** (dark navy, ~120 px): 4 columns (brand blurb, Quick Links, Resources, Company) + BrandsBridge mark + 4 circular social icons; thin darker sub-bar with copyright / tagline / URL.

```
┌──────────────────────────────────────────────────────────────┐
│ ▓ navy utility bar  [logo]              Power by BrandsBridge│
├──────────────────────────────────────────────────────────────┤
│ Home Companies Opportunities ... Contact  [Register][Request]│
├──────────────────────────────────────────────────────────────┤
│ ▓▓ HERO (photo + navy overlay)   ┌────────────────────────┐  │
│ Become a Premium Local Partner   │ Compare Membership     │  │
│ and Grow Internationally         │ Plans (table)          │  │
│ subcopy…                         │ Features|Free|Verif|Prem│ │
│ Starting from                    │ 13 rows of – / ✓       │  │
│ USD 3,000 /year                  │                        │  │
│ [Apply for Premium Membership]   └────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ [🔍][👤][🌐][🤝][🎧][📊]  6-up benefit strip                 │
├──────────────────────────────────────────────────────────────┤
│ ┌ What You Get (6 ✓ bullets) ┐ ┌ How It Works ①→②→③→④ ┐     │
├──────────────────────────────────────────────────────────────┤
│ ▓ Need Assistance? …                        [ Book a Call ]  │
├──────────────────────────────────────────────────────────────┤
│ ▓ FOOTER: brand | Quick Links | Resources | Company | social │
│ ▓ © 2024 …        tagline …                 www.tradeindrc.com│
└──────────────────────────────────────────────────────────────┘
```

Density is high but disciplined: generous whitespace inside cards, ~40 px side margins, consistent ~20 px gutters. The hero table overlapping the photo is the one "fancy" layered move.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#001A57` / `#0A1E5C` | Utility bar, hero overlay, assistance banner, footer, step badges, headings on dark |
| Darker navy | `#001240` | Footer bottom sub-bar |
| Royal blue | `#2563EB` / `#1D4ED8` | "Request a Partner" button, icons, "How It Works" step icons, links |
| Brand red | `#E11B22` / `#D7141A` | "Apply for Premium Membership" CTA, logo accent |
| Golden yellow | `#F5A623` / `#FFB612` | "Register Your Company" button, "Connect – invest – Grow" tagline, "USD 3,000" price? (price is red-orange `#E8541A`-ish), yellow underline under active nav item |
| Green | `#22A65B` | Check marks in comparison table and benefits list |
| White | `#FFFFFF` | Nav bar, cards, table, section backgrounds |
| Off-white/light gray | `#F5F6F8` | Page background between cards, table header row tint |
| Dark gray text | `#1F2937` | Body copy, table labels |
| Mid gray | `#9CA3AF` | Dashes ("–") in table, captions |

Brand logic: DRC flag palette — **blue + yellow + red** — used semantically: yellow = register/free entry, blue = partner/demand-side, red = premium purchase (highest-arousal CTA). Green is reserved purely for "included/success" semantics.

## 4. Typography

- Single **geometric/humanist sans** family throughout (Montserrat/Inter-like); no serifs.
- H1: "Become a Premium Local Partner…" ~34 px, Bold, white, sentence case, two lines.
- Price: "USD 3,000" ~40 px ExtraBold red-orange with "/ year" small suffix — the loudest text element after the H1.
- Card titles ("Compare Membership Plans", "What You Get…", "How It Works") ~18–20 px Bold, navy/near-black.
- Table rows, bullets, captions: ~10–12 px Regular/Medium.
- Benefit-strip titles ~12 px Bold navy; step labels Bold ~12 px.
- Nav links ~12 px Medium, sentence case. Micro-labels 9–10 px in footer.
- Casing: Title Case for headings/CTAs, sentence case body. No letterspacing tricks, no italics.

## 5. Components

- **Utility bar**: navy strip; logo (DRC map silhouette in blue/red + "Trade in DRC" + yellow tricolor tagline "Connect – invest – Grow"); right-aligned BrandsBridge lockup.
- **Nav bar**: white, 9 text links; active item ("Opportunities" area) marked with a short yellow underline bar; two pill buttons: yellow filled "Register Your Company" (navy text) and blue filled "Request a Partner" (white text), radius ~6 px.
- **Hero**: full-bleed mining photo, left→right navy gradient overlay; H1 with a subtle angled navy tab/slab behind first line; sub-paragraph ~3 lines; "Starting from" eyebrow; giant price; red rectangular CTA "Apply for Premium Membership" (radius ~4 px, slight drop shadow).
- **Comparison table card**: white, radius ~10 px, soft shadow, floats over hero. Header: centered bold title, then 4 columns: Features / Free Listing / Verified Company (One-time Fee) / Premium Local Partner (USD 3,000 / year). 13 feature rows (Directory Listing → BrandsBridge Introduction Support) with green ✓ or gray –; hairline row dividers; left column left-aligned, value columns centered.
- **Benefits strip**: one wide white card (hairline border, radius ~8 px) with 6 icon blocks separated by implied columns: Priority in Search Results, Receive Qualified Business Requests, Bilingual Profile (FR/EN), B2B Meetings, BrandsBridge Support, Visibility Reports. Icons are thin-line navy circles ~40 px with small captions beneath titles.
- **"What You Get" card**: white, hairline border, radius ~8 px; 6 checklist rows, green check + 1-line benefit.
- **"How It Works" card**: same card style; 4 steps, each: navy circular number badge (①–④) above a blue line-icon (~44 px), Bold step name, 3-line caption; light gray chevron/arrow connectors between steps.
- **Assistance banner**: navy rounded bar (radius ~8 px) with faint gold map-line texture right side; headset icon in circle; bold "Need Assistance?" + regular sentence; ghost/outlined white "Book a Call" button with calendar icon.
- **Footer**: brand column (logo + 2-line description), 3 link columns with bold column headers, BrandsBridge lockup, 4 white circular social buttons (LinkedIn, Twitter, YouTube, Mail); bottom sub-bar with © / centered tagline / URL.

## 6. Borders, radii, shadows & effects

- Radii: small and consistent — buttons ~4–6 px, cards ~8–10 px, circular icon chips. Nothing fully pilled except social circles.
- Strokes: 1 px hairline `#E5E7EB` card borders and table row dividers; outlined button 1 px white.
- Shadows: one soft, low-blur shadow on the floating comparison card and red CTA; flat elsewhere.
- Gradient/overlay: hero photo darkened with a navy gradient (opaque left → transparent right) so white text passes; assistance banner and footer carry a faint golden network/contour-line texture.
- No glassmorphism, no heavy gradients — flat corporate style with one layered hero card.

## 7. Imagery & iconography

- **Hero photo**: open-pit mining scene — a large yellow Komatsu-style excavator loading a haul truck against terraced earth and sky. Full-bleed, color photo with navy multiply overlay on the left half; signals DRC's mining economy. Only photo on the page.
- **Texture**: subtle gold line-art (map contour/network nodes) on navy bands (assistance banner, footer edge).
- **Icons**: consistent thin-line (≈1.5 px) outline style, mostly navy or royal blue, in circles: magnifier+person, person badge, globe with EN/FR tag, handshake in circle, headset, bar-chart; "How It Works" uses line icons (form/checklist, document-check, person-gear, envelope) with navy filled number dots. Green checkmarks are simple filled-stroke ticks. Social icons are filled glyphs in white circles.

## 8. Content & copy

All **English** on this artboard (the FR sibling presumably mirrors it). Key strings:

- H1: "Become a Premium Local Partner and Grow Internationally"
- Sub: "Increase your visibility, demonstrate your capabilities and receive qualified business requests from companies looking for reliable partners in the DRC."
- "Starting from" / "USD 3,000 / year" / CTA "Apply for Premium Membership"
- Table title "Compare Membership Plans"; columns "Free Listing", "Verified Company (One-time Fee)", "Premium Local Partner (USD 3,000 / year)"; rows: Directory Listing, Basic Company Information, Contact Details, Verified Badge, Priority in Search Results, Bilingual Profile (French / EN), Product / Service Showcase, Partnership Requests, B2B Meeting Invitations, Visibility Reports, Sponsored Placement, BrandsBridge Introduction Support.
- Benefits: "Priority in Search Results — Get seen by international buyers first." / "Receive Qualified Business Requests — From verified companies seeking partners." / "Bilingual Profile (FR/EN) — Present your company professionally." / "B2B Meetings — Get invited to exclusive business meetings." / "BrandsBridge Support — Benefit from our network and market expertise." / "Visibility Reports — Track your performance and reach."
- "What You Get" bullets: Enhanced visibility across the DRC's growing network of investors and companies / Access to qualified international business requests / Inclusion in search rankings with premium placement / Introduction to B2B meetings and strategic partners / Ability to showcase your products, services and capabilities / Opportunity to sponsor sector or market reports (optional).
- How It Works: ① Apply Online — "Complete the application form and select the Premium membership." ② Profile Review — "Our team reviews and verifies your documents and company information." ③ Profile Activation — "Once approved, your premium profile goes live on the directory." ④ Receive Opportunities — "Start receiving qualified business requests and international connections."
- Banner: "Need Assistance? Contact our team for help with your Premium membership." / "Book a Call"
- Footer tagline: "Trade in DRC – Connecting international business with local opportunities." / "© 2024 Trade in DRC. All rights reserved." / "www.tradeindrc.com" / nav header "Power by BrandsBridge Group" (typo: should be "Powered by").

Tone: confident B2B sales copy, benefit-led, no hype words.

## 9. UX assessment

**Works well:** Clear single conversion goal — the red CTA is the only red element and sits directly under the price; comparison table above the fold answers "why pay" immediately; 4-step "How It Works" reduces perceived risk; green-✓/gray-– matrix is instantly scannable; DRC-flag color semantics are consistent across the whole design set.

**Risks:** (1) Table text at ~9–10 px is below comfortable reading size and will fail on smaller viewports — needs a responsive rework (stacked plan cards on mobile). (2) White subcopy over the photo's bright sky edge could drop below WCAG AA where the overlay thins. (3) Gray "–" marks are low-contrast (~2:1). (4) "Power by" typo and mixed "Trade in DRC"/"TradeInDRC" naming. (5) 13-row table in the hero competes vertically with the headline on shorter laptops; the price appears twice (hero + table header), fine, but currency positioning for FR locale must be handled. (6) No middle-tier price shown for "Verified Company" ("One-time Fee" without an amount invites support tickets).

## 10. Mapping to TradeInDRC site

- **Route:** maps to the existing **premium packages** surface — `/[locale]/premium` (or `/promote-your-business`); nav item "Promote Your Business". The 2026-06-04 customer batch already defined $3,000/$3,600 premium packages — this design is the canonical marketing page for that offering.
- **Implementation notes (Tailwind/shadcn):**
  - Hero: `next/image` mining photo + `bg-gradient-to-r from-[#0A1E5C] via-[#0A1E5C]/80 to-transparent` overlay; price block as a stat; red CTA as `<Button>` variant with brand-red token.
  - Comparison table: shadcn `Table` inside a `Card` with `shadow-lg`, absolutely positioned/overlapping the hero on `lg:` only; on mobile collapse into three stacked plan `Card`s with per-plan feature lists (do NOT ship a 4-col table on mobile). Checks = `lucide-react` `Check` in green-600; dashes = `Minus` in gray-400 with `aria-label="not included"`.
  - Benefits strip: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6` inside one bordered `Card`; lucide line icons match the drawn style.
  - What You Get / How It Works: two `Card`s in `lg:grid-cols-[1.2fr_1fr]`; steps as `grid-cols-4` with `ChevronRight` separators hidden on mobile.
  - Assistance banner: full-width navy `Card` + outline `Button` ("Book a Call") — wire to `/contact` or Cal.com-style scheduling (open-source constraint: prefer self-hostable Cal.com).
  - Apply CTA → the existing request/apply flow (dashboard company onboarding or a dedicated application form feeding `companies`/verification tables; ties to admin verifications queue).
  - i18n: every string through next-intl (`en`/`fr`); fix "Power by" → "Powered by"; FR price formatting "3 000 USD / an".
  - Motion per `docs/MOTION.md`: restrained — fade/slide-up ≤300 ms on hero card mount, ≤180 ms hover lifts on plan CTA; no scroll-jacking.
  - All animations/hover states must respect `prefers-reduced-motion`.
