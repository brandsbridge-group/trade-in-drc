# Premium Membership / Pricing — design 12 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/12.pdf`
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/12-premium-membership.md`
- App route: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/(public)/pricing/page.tsx`
- Server action: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/(public)/pricing/actions.ts`
- Components: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/pricing/premium-cta.tsx`, `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/pricing/premium-status-card.tsx`
- Strings: `Pricing` namespace in `src/config/messages/en.json` (and fr.json)

## THE DESIGN SPEC

Single desktop artboard (~1170 px), corporate DRC-flag palette: deep navy `#0A1E5C`, royal blue `#2563EB`, brand red `#E11B22`, golden yellow `#F5A623`, green `#22A65B` checks, off-white `#F5F6F8` background. Flat style, hairline `#E5E7EB` borders, radii 4–10 px, one soft shadow on the floating table card.

```
┌──────────────────────────────────────────────────────────────┐
│ ▓ navy utility bar  [logo]              Power by BrandsBridge│
├──────────────────────────────────────────────────────────────┤
│ Home Companies Opportunities ... Contact  [Register][Request]│
├──────────────────────────────────────────────────────────────┤
│ ▓▓ HERO (mining photo + navy overlay)  ┌──────────────────┐  │
│ Become a Premium Local Partner         │ Compare Membership│ │
│ and Grow Internationally               │ Plans (table)     │ │
│ subcopy…                               │ Feat|Free|Ver|Prem│ │
│ Starting from                          │ 13 rows of – / ✓  │ │
│ USD 3,000 /year                        │                   │ │
│ [Apply for Premium Membership]  (red)  └──────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ [🔍][👤][🌐][🤝][🎧][📊]  6-up benefit strip                 │
├──────────────────────────────────────────────────────────────┤
│ ┌ What You Get (6 ✓ bullets) ┐  ┌ How It Works ①→②→③→④ ┐    │
├──────────────────────────────────────────────────────────────┤
│ ▓ Need Assistance? …                        [ Book a Call ]  │
├──────────────────────────────────────────────────────────────┤
│ ▓ FOOTER: brand | Quick Links | Resources | Company | social │
│ ▓ © 2024 …        tagline …                 www.tradeindrc.com│
└──────────────────────────────────────────────────────────────┘
```

### 1. Hero band (~305 px, full-bleed photo)

- Full-bleed **open-pit mining photo** (yellow excavator + haul truck) with navy gradient overlay (opaque left → transparent right).
- H1 white ~34 px Bold: **"Become a Premium Local Partner and Grow Internationally"**, with a subtle angled navy slab behind line 1.
- Subcopy (white, ~3 lines): "Increase your visibility, demonstrate your capabilities and receive qualified business requests from companies looking for reliable partners in the DRC."
- Eyebrow "Starting from" + giant price **"USD 3,000 / year"** — ~40 px ExtraBold red-orange, loudest element after the H1.
- One dominant **red CTA** "Apply for Premium Membership" (radius ~4 px, slight drop shadow). Red appears nowhere else on the page.

### 2. Compare Membership Plans card (floats over the hero, right ~40%)

- White card, radius ~10 px, soft shadow, overlapping the photo — the page's one layered move.
- Centered bold title "Compare Membership Plans".
- 4 columns: **Features / Free Listing / Verified Company (One-time Fee) / Premium Local Partner (USD 3,000 / year)**.
- **13 feature rows**: Directory Listing, Basic Company Information, Contact Details, Verified Badge, Priority in Search Results, Bilingual Profile (French / EN), Product / Service Showcase, Partnership Requests, B2B Meeting Invitations, Visibility Reports, Sponsored Placement, BrandsBridge Introduction Support — each cell a green ✓ `#22A65B` or gray "–" `#9CA3AF`; hairline row dividers; value columns centered.

### 3. Benefits strip (one bordered white card, 6 equal columns)

Thin-line navy circle icons ~40 px + bold ~12 px title + 2-line gray caption:
1. Priority in Search Results — "Get seen by international buyers first."
2. Receive Qualified Business Requests — "From verified companies seeking partners."
3. Bilingual Profile (FR/EN) — "Present your company professionally." (globe icon with EN/FR tag)
4. B2B Meetings — "Get invited to exclusive business meetings." (handshake)
5. BrandsBridge Support — "Benefit from our network and market expertise." (headset)
6. Visibility Reports — "Track your performance and reach." (bar chart)

### 4. Two-panel section

- **"What You Get as a Premium Local Partner"** (left, ~55%, white card, hairline border, radius ~8 px): 6 green-check bullets — enhanced visibility across the DRC network / access to qualified international business requests / premium placement in search rankings / introduction to B2B meetings and strategic partners / showcase products, services and capabilities / opportunity to sponsor sector or market reports (optional).
- **"How It Works"** (right, ~45%): 4 horizontal steps with navy numbered dots ①–④ above blue line icons and light-gray arrow connectors:
  ① Apply Online — "Complete the application form and select the Premium membership."
  ② Profile Review — "Our team reviews and verifies your documents and company information."
  ③ Profile Activation — "Once approved, your premium profile goes live on the directory."
  ④ Receive Opportunities — "Start receiving qualified business requests and international connections."

### 5. Assistance banner

Navy rounded bar (radius ~8 px) with faint gold contour-line texture: headset icon in circle + bold **"Need Assistance?"** + "Contact our team for help with your Premium membership." + outlined white ghost button **"Book a Call"** with calendar icon.

### 6. Chrome (shared): navy utility bar + white nav (9 links, yellow "Register Your Company" + blue "Request a Partner" pills), navy 4-column footer with social circles, "Power by BrandsBridge Group" lockups.

**Purpose:** single-goal conversion page selling the USD 3,000/year Premium Local Partner tier to Congolese companies; the comparison matrix answers "why pay" above the fold; the 4-step flow de-risks the purchase.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Hero full-bleed mining photo + navy overlay | Photo behind text, navy gradient overlay | 🟡 | `pricing/page.tsx` hero section | Photo exists (`/images/hero/hero-pricing.jpg`) but boxed in a rounded-2xl card on the RIGHT of a white hero — not full-bleed, no navy overlay, no text over photo |
| H1 "Become a Premium Local Partner and Grow Internationally" | ~34 px Bold white on photo | 🟡 | `page.tsx` `hero.title` | Different copy ("Choose the Right Profile for Your Business"), dark slate on white background |
| Hero subcopy (visibility/qualified requests) | White 3-line paragraph | 🟡 | `hero.subtitle` | Different copy, gray on white |
| "Starting from USD 3,000 / year" price hero stat | ~40 px ExtraBold red-orange | ❌ | — | No hero price; prices only appear inside plan cards |
| Red "Apply for Premium Membership" CTA | Brand-red `#E11B22` rect, shadow, single red element | 🟡 | `hero.getPremiumCta` / `PremiumCta` | App has primary + outline buttons ("Register Free" / "Get Premium"); no brand-red CTA anywhere |
| Compare Membership Plans table (4 cols × 13 rows) | White floating card over hero, green ✓ / gray – matrix | ❌ | — | App uses 3 stacked plan cards with per-plan bullet lists; no side-by-side feature matrix, no ✓/– grid |
| "Free Listing" tier | Column in matrix | ✅ | `plans.free` PlanCard | Rendered as a card, not a column; 5 features |
| "Verified Company (One-time Fee)" middle tier | Matrix column | ❌ | — | App's middle tier is "Premium Profile — Congolese Companies $3,000/yr"; no one-time verified tier is sold |
| "Premium Local Partner (USD 3,000 / year)" tier | Matrix column + hero price | ✅ | `plans.premiumCongolese` | Present as $3,000/yr card with "Recommended" badge; naming differs; app adds an extra $3,600 International tier the design lacks |
| 6-up benefits strip (Priority Search / Qualified Requests / Bilingual FR-EN / B2B Meetings / BrandsBridge Support / Visibility Reports) | One bordered card, 6 columns, navy circle line-icons | 🟡 | "Why Go Premium?" section, `page.tsx` | App has 6 benefit tiles but in a 3×2 grid of separate slate cards with square primary/10 icon chips; copy differs (no Bilingual FR/EN, no BrandsBridge Support, no B2B Meetings items) |
| "What You Get as a Premium Local Partner" card (6 green ✓ bullets) | White card, green checks | 🟡 | Feature lists inside PlanCards | Content partially covered by plan-card bullets (primary-color checks, not green); no dedicated card with this heading |
| "How It Works" 4-step card (①→②→③→④ with arrows) | Numbered navy dots, blue line icons, arrow connectors | ❌ | — | No application-process explainer anywhere on the page |
| "Need Assistance? … Book a Call" navy banner | Navy rounded bar, headset icon, outlined white button + calendar icon | 🟡 | "Custom package" strip + join banner, `page.tsx` | App has a white "custom package → Contact" strip and a primary-colored join banner; neither is navy, no headset/calendar iconography, no "Book a Call" scheduling framing |
| Green `#22A65B` checkmarks (included semantics) | Green ticks in table + bullets | 🟡 | PlanCard `Check` icons | Checks are `text-primary` (brand blue), not green |
| Navy utility bar + "Power by BrandsBridge Group" lockup | Dark navy strip, BrandsBridge co-brand | ❌ | shared navbar | Site chrome has no BrandsBridge lockup or navy utility bar (chrome-level, shared with other designs) |
| Yellow "Register Your Company" / blue "Request a Partner" nav pills | DRC-flag color CTAs | 🟡 | `src/components/layout/navbar.tsx` | Navbar exists but CTA styling/colors differ from the yellow+blue pill pair |
| Navy footer w/ gold texture, 4 columns, social circles | `#0A1E5C`, contour-line texture | 🟡 | shared footer | Footer exists but not the design's navy/gold treatment (chrome-level) |
| Recommended emphasis on premium tier | Implicit via table column emphasis | ✅ | PlanCard `recommended` prop | App actually exceeds design: floating "Recommended" pill badge |
| Apply flow → application form | Red CTA → application form (step ① "Apply Online") | 🟡 | `premium-cta.tsx` + `actions.ts` `requestPremium` | Functional flow exists (auth-gated, company picker dialog, server action); design implies a fuller application form + document review framing |

## ❌ Design elements the app lacks entirely

**Conversion core**
- **Compare Membership Plans matrix** (4 cols × 13 rows, ✓/–) — implies a canonical feature-by-tier data table (static config is enough; tiers map to `companies.is_premium` / verification tier fields).
- **"Verified Company (One-time Fee)" middle tier** — implies a one-time-fee verification product that doesn't exist in the app's plan model (`PremiumPlan` = congolese | international only).
- **Hero "Starting from USD 3,000 / year" price stat + red Apply CTA** — pure UI; price already in i18n.

**Trust / explainer**
- **"How It Works" 4-step process card** (Apply → Review → Activation → Opportunities) — static content; mirrors the existing admin premium-requests review pipeline, so no new backend.
- **"Need Assistance? / Book a Call" banner** — implies a scheduling link (self-hostable Cal.com per project constraint) or `/contact` deep link.

**Brand chrome**
- **BrandsBridge Group co-branding** (utility bar + footer lockups) — asset + layout only; site-wide, not pricing-specific.

## 🎨 Visual-language delta

The design is a **dark, layered, DRC-flag-branded sales page**; the app is a **light, flat, generic SaaS pricing page**. Concretely:

- **Color:** design leans deep navy `#0A1E5C` bands (hero overlay, banner, footer), red `#E11B22` reserved for the one purchase CTA, green `#22A65B` for "included", yellow accents. The app is slate-50/white with a single blue `primary` doing all jobs (CTAs, checks, banner) — the red/green/yellow semantic system is absent.
- **Hero drama:** design puts white type over a full-bleed mining photo with a floating comparison card overlapping it; the app shows a tidy two-column white hero with the photo tamed inside a rounded border.
- **Card language:** design uses tight radii (4–10 px), hairline borders, one soft shadow; the app uses friendlier rounded-2xl cards — softer and more consumer-SaaS than the design's corporate flatness.
- **Density:** design is denser (13-row matrix above the fold, 6-up strip in one card); the app spreads content over more vertical scroll with fewer facts per viewport.
- **Iconography:** design uses thin-line navy icons in circles + green filled ticks; app uses lucide icons in square primary-tinted chips and primary-colored checks.

## 🔷 App features the design omits (regression watch-list)

- Second premium tier: **Premium Profile — International Companies $3,600/yr** (design has only one paid recurring tier).
- **"Recommended" badge** and elevated middle card.
- **Functional purchase flow**: auth-gated `PremiumCta` with multi-company picker dialog, `requestPremium` server action, toast feedback, `premium-status-card.tsx` for already-premium/pending states.
- "Interested in a custom package?" → Contact strip.
- Free-tier "Register Free" flow into `/register`.
- Framer-motion section-enter animations with reduced-motion handling.

## Verdict

**matchScore: 42**

The app already sells the same $3,000/year premium offering with a working request flow, three plan cards, and a six-item benefits section — functionally it covers most of what the design promises, and even adds an International tier. But visually it is a different page: the design's signature moves — full-bleed mining hero with navy overlay, the floating 13-row Compare Membership Plans matrix, the single red "Apply for Premium Membership" CTA, green-check semantics, the 4-step "How It Works" explainer, and the navy "Book a Call" assistance banner — are all missing or replaced by a generic light-blue SaaS layout. The tier model also diverges: the design's middle tier is a one-time-fee "Verified Company", which the app doesn't sell. Adopting the design means rebuilding the hero and adding the comparison matrix and process/assistance sections, while preserving the app's existing auth-gated request flow and the extra International plan.
