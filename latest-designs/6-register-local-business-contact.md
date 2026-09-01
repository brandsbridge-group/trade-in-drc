# Register Your Company as a Local Business Contact (source: 6.ai)

## 1. Page identification & purpose

This is the **company registration / "Local Contacts" onboarding page** — a hybrid of pricing page + multi-step registration form. Headline: "Register Your Company as a Local Business Contact". Its job: convert Congolese businesses into listed (and paying) members of the portal. It sells three listing tiers (Free / USD 250 / USD 3,000 per year), then lets the visitor start the registration wizard on the same page. It is the supply-side acquisition funnel: international buyers browse; this page recruits the local companies they will find. The "Power by BrandsBridge Group" co-brand appears in the top utility bar and footer, so the design also carries a partner-agency identity.

Design intent: a trust-first, government-adjacent B2B look — deep navy authority, gold CTA energy, verification badges everywhere — with a landing-page structure (hero promise → pricing → form → benefit strip) that compresses the entire funnel into one scroll.

## 2. Layout & grid

Single artboard, desktop, roughly 1100 × 826 pt (≈4:3, clearly a desktop web comp). Full-width dark sections bookend a light middle. 12-col feel; content container ≈ 92% of artboard width with ~40 pt side margins. Density is high — five stacked bands, minimal vertical air (this matches the customer's compact-card preference).

Top-to-bottom section order:

1. **Utility bar** (~35 pt tall, near-black navy): logo left, "Power by BrandsBridge Group" right.
2. **Primary nav bar** (~28 pt, darker navy): 9 text links left; two pill buttons right ("Register Your Company" gold, "Request a Partner" light blue).
3. **Hero** (~210 pt): left-aligned H1 + subline + a horizontal row of 3 icon-bullet value props ("Increase visibility", "Build Trust", "Grow in DRC"); right 40% is a cut-out photo of a smiling businessman with DRC flag + office backdrop. Dark navy photographic background.
4. **Pricing tier row** (3 equal cards, ~145 pt tall) — cards overlap the hero bottom edge by ~30 pt (floating over the seam between dark hero and light body).
5. **Stepper** (5 numbered steps with chevron separators): Legal Information → Professional Information → Partnership Positioning → Documents Upload → Review & Submit. Step 1 active (filled navy circle).
6. **Form panel** (~200 pt tall, white card): four side-by-side columns showing sections 1–4 of the form simultaneously (Legal Info / Professional Info / Partnership Positioning / Documents Upload), each a 2-col micro-grid of labeled inputs.
7. **Benefit strip** (light gray band, ~55 pt): 4 icon + title + blurb items separated by thin vertical dividers: High Visibility / Verified & Trusted / Receive Opportunities / Grow Your Business.
8. **Footer** (dark navy, ~95 pt): logo + mission paragraph left; 3 link columns (Quick Links, Resources, Company); "Power by BrandsBridge Group" + 4 circular social icons right.
9. **Sub-footer bar** (near-black): "© 2024 Trade in DRC. All rights reserved." left, tagline center, "www.tradeindrc.com" right.

```
+--------------------------------------------------------------+
| logo  Connect–Invest–Grow            Power by BrandsBridge   |
+--------------------------------------------------------------+
| Home Companies Opportunities ... Contact  [Register][Request]|
+--------------------------------------------------------------+
| H1 Register Your Company as a          |   [photo: man,      |
| Local Business Contact                 |    DRC flag]        |
| subline                                |                     |
| (o) Increase  (o) Build   (o) Grow    |                     |
+---------┬-----------------┬------------┴-----------┬---------+
   | FREE card |  | USD 250 card |  | USD 3,000/yr card |   (overlap)
   | ✓✓✓ [CTA] |  | ✓✓✓✓ [CTA]   |  | ✓✓✓✓ [CTA]        |
+--------------------------------------------------------------+
| (1) Legal > (2) Professional > (3) Positioning > (4) Docs > (5) Review |
+--------------------------------------------------------------+
| [1.LEGAL INFO] [2.PROFESSIONAL] [3.POSITIONING] [4.UPLOADS]  |
|  inputs 2-col    inputs 2-col     checkboxes      dropzones  |
+--------------------------------------------------------------+
| (i) High Visibility | (i) Verified | (i) Opportunities | (i) Grow |
+--------------------------------------------------------------+
| logo + mission | Quick Links | Resources | Company | social  |
+--------------------------------------------------------------+
| © 2024 ...        tagline               www.tradeindrc.com   |
+--------------------------------------------------------------+
```

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy (primary) | `#0A1F44` / `#0B2447` | Hero bg, nav bars, footer, card header bars, primary buttons, stepper active circle |
| Near-black navy | `#061229` | Utility bar, sub-footer bar |
| Royal/mid blue | `#1B4FA0` | Section icons, links, form section headers accents, checkmark icons |
| Sky/light blue | `#7EC8F2` / `#8FD3F4` | "Request a Partner" button fill, tag chips (French/English/Swahili), "Browse" links |
| Gold/amber | `#F5A623` / `#FFB020` | "Register Your Company" nav CTA, logo accent, small brand accents ("Invest" word) |
| Green accent | `#2E9E4F` | "Grow" word in tagline, some check ticks |
| Red accent | `#D32027` | Logo mark element, DRC flag in imagery, required-field asterisks |
| White | `#FFFFFF` | Card fills, form panel, hero headline text |
| Light gray | `#F2F5F9` | Page body bg between hero and footer, benefit strip band |
| Mid gray | `#8A94A6` | Placeholder text, helper copy, dividers |
| Ink/dark text | `#1C2534` | Body copy on light surfaces |

Brand logic: DRC flag palette (sky blue, red, yellow/gold) folded into a corporate navy system. The tagline "Connect – Invest – Grow" is tri-colored (blue / gold / green). Navy = trust/government; gold = the money CTA color (only the highest-intent actions get it).

## 4. Typography

- One geometric/neo-grotesque sans throughout (Poppins/Montserrat-like; rounded, wide counters).
- **H1**: ~34 pt, semibold, white, sentence case, two lines, tight leading.
- **Card price**: "FREE" / "USD 250" / "USD 3,000 /year" ~22 pt bold navy; tier name above at ~13 pt semibold.
- **Section labels in form**: ~10 pt bold, ALL-CAPS ("1. LEGAL INFORMATION"), navy, with a small line icon prefix.
- **Field labels**: ~7–8 pt medium, dark gray, with red `*` for required.
- **Inputs/placeholders**: ~7 pt regular, mid gray.
- **Benefit strip titles**: ~9 pt bold navy; blurbs ~7 pt regular gray, 2 lines.
- Casing mix: sentence case for marketing copy, ALL-CAPS only for form section headers. No serifs, no italics. Checklists use ✓ glyph + ~8 pt regular.

## 5. Components

- **Utility bar**: flat near-black strip; logo lockup (icon + "Trade in DRC" + tri-color tagline) left; partner lockup right.
- **Nav bar**: text links ~9 pt white; two CTA buttons — gold filled pill-ish rect (radius ~4 pt) "Register Your Company" (navy text), and light-blue filled rect "Request a Partner" (navy text, envelope icon on second button variant).
- **Hero value-prop bullets**: 3 items in a row, each = small circular outline icon (~18 pt circle, thin white/gray stroke) + bold title + 2-line description, white text on dark photo.
- **Pricing cards ×3**: white fill, thin navy border (~1 pt), radius ~6 pt, **navy top header bar** (~6 pt solid strip across card top). Structure: line icon (bank / shield-check / crown) top-left, tier name, big price, 1–2 line description, 4-item ✓ checklist, full-width bottom CTA. CTA variants: Free = white/outline navy button ("Select Free Listing"); Verified & Premium = solid navy buttons ("Choose Verified", "Choose Premium"). Subtle drop shadow lifts cards over the hero seam.
- **Stepper**: 5 nodes, numbered circles (~14 pt), active = solid navy with white "1", inactive = outline gray; labels right of each circle; thin chevron ">" separators.
- **Form panel**: one large white card (radius ~8 pt, hairline border, soft shadow) containing 4 columns divided by hairline vertical rules. Inputs: white fill, 1 pt light-gray border, radius ~3 pt, ~14 pt tall. Selects show caret glyph. Phone fields have "+243 ▾" prefix segment. Language chips: light-blue rounded tags with "×" removers (French ×, English ×, Swahili ×). Checkbox list (Partnership Positioning): Investment Partnerships / Distribution Agreements / Supply & Procurement / Joint Ventures / Technology Transfer / Other (please specify) + free-text input. Upload column: 4 dashed-border dropzones ("Drag & drop or Browse", Browse as blue link) for RCCM Certificate, Tax Identification (NIF), Company Logo (Optional), Additional Documents (Optional); helper text "Upload clear, legible documents (PDF, JPG or PNG, Max 5MB per file)".
- **Benefit strip**: 4 cells, circular thin-line icon (megaphone, shield-check, network nodes, growth/gear) in navy, bold title, gray blurb, hairline vertical dividers between cells.
- **Footer**: 4-column dark layout; link lists ~7 pt light gray; social icons = white circles (~14 pt) with navy glyphs (LinkedIn, X/Twitter, YouTube, Email).

## 6. Borders, radii, shadows & effects

- Radius scale is conservative: buttons ~4 pt, inputs ~3 pt, cards 6–8 pt. No pills except tag chips (~full round).
- Hairline (0.5–1 pt) light-gray borders on all inputs/cards; navy 1 pt border + navy top-edge strip on pricing cards (signature detail).
- Dashed 1 pt borders for upload dropzones.
- Shadows: soft, low-blur, low-opacity under pricing cards and the big form card — enough for lift, no heavy drops.
- Hero uses a photographic background with a dark navy multiply/overlay gradient (darker at left where text sits, image visible right). No glassmorphism, no gradient fills on UI elements.
- Vertical hairline dividers structure both the form columns and the benefit strip.

## 7. Imagery & iconography

- **Hero photo**: professional Black businessman, navy suit, arms crossed, smiling, standing beside a laptop; DRC national flag on a pole to his right; blurred modern office/city window behind. Treatment: color photo under a navy overlay that fades left-to-right so the left text zone reads clean. Not duotone; realistic corporate stock style.
- **Icons**: consistent thin-line style, mostly enclosed in circles. Set includes: bank/institution (Free tier), shield with check (Verified), crown (Premium), megaphone, network/nodes, gear-growth, section glyphs beside form headers, envelope in nav CTA. Navy or white strokes, ~1.5 pt weight, rounded terminals.
- **Logo**: bar-chart-like mark using flag colors + "Trade in DRC" wordmark + "Connect – Invest – Grow" tri-color tagline.

## 8. Content & copy

Language: **English only** (site is EN/FR — FR version not shown). Tone: confident, benefit-led, B2B.

Key strings (as visible):
- H1: "Register Your Company as a Local Business Contact"
- Sub: "Put your Company in front of business partners looking for opportunities in the DRC."
- Value props: "Increase visibility — Be found by verified buyers and partners." / "Build Trust — Get verified and stand out in the marketplace." / "Grow in DRC — Generate qualified requests and new business."
- Tiers: "Registered Listing — FREE — Basic company listing to get discovered by local and international partners" (Basic company profile / Listed in directory search / Receive partnership requests); "Verified Company — USD 250 — Verified badge builds trust and increases visibility with more details" (All Registered Listing benefits / Verified badge / Enhanced profile visibility / Priority in search results); "Premium Local Partner — USD 3,000 /year — Maximum visibility, lead access and featured placement" (All Verified Company benefits / Featured placement / Lead insights & analytics / Dedicated support).
- CTAs: "Select Free Listing", "Choose Verified", "Choose Premium", "Register Your Company", "Request a Partner".
- Form fields (sample): Company Legal Name*, Trading Name (if different), RCCM Number*, National Identification Number*, Tax Identification Number (NIF)*, Year Established*, Legal Form, Number of Employees, Sector*, Products / Services*, Province*, City*, Website, Official Email*, Phone Number* (+243), Alternative Phone, Contact Person*, Job Title* (e.g. Managing Director), Preferred Contact, Languages Spoken (French/English/Swahili chips), International Opportunities of Interest (checkbox list).
- Footer tagline: "Trade in DRC – Connecting international business with local opportunities." Mission: "Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo."
- Note: nav differs from current site IA — "Marketplace, Local Contacts, Market Intelligence, Promote Your Business" appear. Typos in comp: "Power by" (should be "Powered by").

## 9. UX assessment

**Works well:**
- Clear monetization ladder; price anchoring (Free → 250 → 3,000) with consistent checklist structure makes comparison instant.
- Gold reserved for the single highest-value CTA in the nav = good visual economy.
- Verification framing (badges, shield icons, "Verified & Trusted") matches the trust problem of a frontier market.
- Benefit strip reinforces the pitch right before footer — good closing argument.
- DRC-localized form (RCCM, NIF, +243, provinces, French/Swahili chips) shows genuine domain grounding.

**Risky / to fix:**
- **All 4 form steps shown side-by-side contradicts the 5-step stepper.** In the comp it's an illustration of scope, but implemented literally it's a wall of ~25 fields. Build it as a true wizard: one step visible, stepper state advances. (Step 5 "Review & Submit" has no column at all — confirms it's a wizard.)
- No pricing→form connection shown: which tier did the user pick when they reach the form? Need selected-tier state carried into the wizard and a payment step for paid tiers.
- 7 pt labels/placeholders are far below accessible sizes; must map up to ≥14 px (labels) in implementation.
- Hero text over photo: left side is safely darkened, but the 3 value-prop bullets sit near the photo edge — contrast risk at tablet widths; keep the overlay gradient behind them.
- Light-blue "Request a Partner" button with navy text is fine, but light-blue chips with white "×" would fail contrast — use navy glyphs.
- "Power by" typo; "USD 3,000 /year" vs one-time USD 250 pricing needs explicit billing-period labels to avoid confusion.
- Nav has 9 items + 2 buttons — will not fit at laptop widths without a mega-menu/priority+ pattern.
- Missing states: validation errors, upload progress, disabled steps — must be specified before build.

## 10. Mapping to TradeInDRC site

- **Primary route**: this is the **Premium packages + registration flow** — maps to the existing premium packages work (customer batch 2026-06-04: $3,000/$3,600 packages, request page) and to `/dashboard` company creation. Suggested route: `/[locale]/register-company` (public marketing + wizard) or fold into `/premium` + `/dashboard/company/new`. The "Request a Partner" CTA maps to the existing **Request page**.
- **Pricing note**: comp shows Free / USD 250 / USD 3,000-year — reconcile with the previously approved $3,000/$3,600 premium packages before build.
- **Implementation (Tailwind/shadcn):**
  - Tiers: 3× `Card` with `border-primary` + a `before:` 6 px top strip (`bg-primary`); checklist = `Check` lucide + `text-sm`; CTAs = `Button` (outline for Free, default for paid).
  - Stepper: no shadcn primitive — build a small `Stepper` component (ol + `aria-current="step"`), reuse across the wizard; state in Zustand (per project memory: stateful dashboards).
  - Wizard: `react-hook-form` + `zod` per-step schemas; one step rendered at a time; persist draft to Supabase (`companies` table + new columns/tables for RCCM/NIF/positioning); uploads to Supabase Storage with dropzone (`border-dashed`).
  - Language chips: shadcn `Badge` variant with remove button; phone prefix: `InputGroup`-style flex with fixed `+243` `Select`.
  - Colors: hero/footer `#0B2447` → extend Tailwind `primary`; gold `#F5A623` as `accent` reserved for top-conversion CTAs only.
  - i18n: every string above needs `en`/`fr` keys in `src/config/messages/`; form validation messages bilingual.
  - Motion (per docs/MOTION.md): card hover lift ≤180 ms; step transitions ≤300 ms fade/slide; no animated hero gimmicks.
  - Footer social + "Powered by BrandsBridge Group" lockup: add to existing footer config; confirm the co-brand is contractual before shipping.
