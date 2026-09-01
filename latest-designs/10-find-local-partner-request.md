# Find a Local Partner (Request Page) (source: 10.ai)

## 1. Page identification & purpose

This is the **"Find a Local Partner in the DRC"** page — a lead-capture / matchmaking request page under the "Local Contacts" nav item. Its job: let an international buyer describe their business need (supplier, distributor, representative, JV partner, etc.) so the TradeInDRC team can match them with verified Congolese contacts. It is a 3-step funnel presented as a single scrolling page: (1) pick need type, (2) fill a detailed request form, (3) confirmation state with a Request ID. Language of all copy: **English**. Design intent: authoritative, trustworthy, form-forward — less "marketing hero," more "service intake portal," with a compact photographic hero to keep the government-portal gravitas.

## 2. Layout & grid

Top-to-bottom order:
1. **Utility topbar** (dark navy, full width): logo left, "Power by BrandsBridge Group" right.
2. **Main nav bar** (white): 9 text links left, two CTA buttons right (yellow "Register Your Company", blue "Request a Partner").
3. **Hero band** (~25% of artboard height): navy background, left column = breadcrumb + H1 + paragraph + 2 buttons; right ~45% = photo of a handshake between two businessmen over a river-city skyline, edge-blended into the navy.
4. **3-column process section** on white (~50% of artboard): columns are unequal — Step 1 (~28% width, 2×4 grid of need-type tiles), Step 2 (~42% width, two-column form), Step 3 (~24% width, green success card). Each column headed by a numbered dark-navy square badge (1/2/3) + bold heading + one-line subhead.
5. **Micro-footnote row**: lock icon + privacy reassurance line, centered under the form.
6. **Footer** (dark navy): logo + description left; 3 link columns (Quick Links / Resources / Company); BrandsBridge logo + 4 circular social icons right; bottom bar with © line, tagline, URL.

Density is high — this is an information-dense working page, generous only in the hero. Alignment is a clean left-edge grid; the three step columns share a common top baseline.

```
┌────────────────────────────────────────────────────────────┐
│ ▓ logo "Trade in DRC"                Power by BrandsBridge │ topbar (navy)
├────────────────────────────────────────────────────────────┤
│ Home Companies Opportunities ... Contact  [Register][Req.] │ nav (white)
├────────────────────────────────────────────────────────────┤
│ ▓ Home › Find a Local Partner          ┌────────────────┐  │
│ ▓ FIND A LOCAL PARTNER IN THE DRC      │  photo:        │  │ hero (navy)
│ ▓ Tell us what your business needs...  │  handshake +   │  │
│ ▓ [Submit Your Need →][Browse Directory│  skyline       │  │
├────────────────────────────────────────┴────────────────┴──┤
│ [1] What do you need?   [2] Tell us about...  [3] Request  │
│ ┌────┐┌────┐            ┌─────────┐┌────────┐ Submitted    │
│ │Supp││Dist│            │Company* ││Contact*│ ┌──────────┐ │
│ ├────┤├────┤            │Country* ││Province│ │  ✓ green │ │
│ │Rep ││JV  │            │Website  ││Product*│ │ Thank you│ │
│ ├────┤├────┤            │Contact* ││Volume  │ │ TIDRC-.. │ │
│ │Prof││Inst│            │Email*   ││Timeline│ │ 3 bullets│ │
│ ├────┤├────┤            │Phone*   ││Detail  │ │[Submit  ]│ │
│ │Mkt ││Src │            │Sector*  ││Upload  │ │ Browse → │ │
│ └────┘└────┘            ☑☑☑☐ checkboxes      └──────────┘ │
│ ⓘ one primary need      🔒 info is secure...               │
├────────────────────────────────────────────────────────────┤
│ ▓ footer: logo/desc | Quick Links | Resources | Company    │
│ ▓ © 2024 ... | tagline | www.tradeindrc.com                │ (navy)
└────────────────────────────────────────────────────────────┘
```

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Deep navy | `#0A1E5C` / `#0B1F60` | Topbar, hero band, footer, step-number badges, primary headings, "Request a Partner" button fill |
| Royal blue | `#1D4ED8`–`#2455C8` | Nav CTA "Request a Partner", link accents, form focus, breadcrumb hover |
| Brand yellow/amber | `#F5A700` / `#FFB000` | "Register Your Company" + "Submit Your Need" buttons, breadcrumb "Home", logo tagline accents |
| Success green | `#22A24B` / `#16A34A` | Step-3 check circle, checked checkboxes, "Connect" word in logo tagline |
| Pale green tint | `#EFF8F1` | Step-3 confirmation card background |
| Red | `#D22630` | Small accent in logo mark (DRC map/flag element), "Grow" word |
| White | `#FFFFFF` | Nav bar, main section background, tiles/cards, hero text |
| Light gray | `#F7F8FA` | Input field fills, tile hover tint |
| Border gray | `#D9DDE3` | Input/tile borders, dividers |
| Body gray | `#4B5563` / `#6B7280` | Paragraphs, labels, placeholders |

Brand logic: DRC flag palette — **sky blue/navy + yellow + red** — with navy as the institutional base, yellow as the action color, green reserved for success semantics. The logo tagline "Connect – Invest – Grow" is tri-colored (green/blue-yellow/red mix).

## 4. Typography

- Single geometric/neo-grotesque **sans-serif** family throughout (Inter/Poppins-like; slightly rounded terminals).
- H1 "Find a Local Partner in the DRC": ~44–48 px, Bold, white, sentence case with "DRC" capitalized; a faint ghost/echo of the text sits behind it (duplicated layer artifact or intentional low-opacity echo).
- Step headings ("What do you need?"): ~20–22 px, Bold, near-black navy.
- Step subheads: ~13 px regular gray.
- Form labels: ~12 px semibold dark, with red/dark asterisks for required.
- Placeholders: ~12 px regular light gray.
- Buttons: ~13–14 px semibold, sentence/title case, no uppercase tracking.
- Footer column titles: ~13 px semibold white; links ~12 px regular, light blue-gray.
- No serifs, no italics; hierarchy achieved purely by weight + size + color.

## 5. Components

- **Topbar**: full-width navy strip, ~48 px; logo mark (DRC map silhouette in blue/red with handshake motif) + wordmark "Trade in DRC" + tri-color tagline "Connect – Invest – Grow"; right side "Power by" + BrandsBridge Group logo (pink/magenta X-mark).
- **Nav bar**: white, ~44 px; 9 links: Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact. Two buttons: yellow filled rounded (~6 px radius) "Register Your Company"; blue filled "Request a Partner" (this page's own CTA — active context).
- **Breadcrumb**: "Home › Find a Local Partner"; "Home" in yellow, current page white.
- **Hero buttons**: primary = yellow fill, dark navy text, trailing arrow "Submit Your Need →" (~radius 4–6 px); secondary = transparent with 1 px white border, "Browse the Directory First".
- **Need-type tiles (Step 1)**: 8 tiles in a 2×4 grid; white fill, 1 px gray border, ~8 px radius, subtle shadow; each = line icon (top-left) + 1–2-line label. Labels: Find a Supplier / Find a Distributor / Find a Local Representative / Find a Joint-Venture Partner / Find a Professional Service Provider / Find an Institutional Contact / Enter the DRC Market / Source Products from the DRC. Below grid: info line with ⓘ icon "You can select only one primary need per request."
- **Step badges**: ~26 px navy squares (small radius) with white bold number.
- **Form card (Step 2)**: white panel, 1 px border, ~8 px radius; two sub-columns of stacked fields. Left column: Company Name*, Country* (select), Website, Contact Person*, Email*, Phone* (country-code select `+1` + `(555) 123-4567`), Sector* (select). Right column: Type of Contact Needed* (select), Target Province in DRC* (select), Product or Service of Interest*, Estimated Business Volume (USD) (select "Select range"), Expected Timeline* (select), Detailed Requirement* (textarea), Upload Supporting Document (Optional) — dashed-border dropzone with upload icon, "Click to upload or drag and drop — PDF, DOC, DOCX, PPTX (Max 10MB)". Inputs: ~38 px tall, light-gray fill, 1 px border, ~6 px radius; selects have chevron.
- **Checkbox row** under form: 3 pre-checked green checkboxes — "Verified companies only", "Arrange B2B meetings", "Market-entry support" — plus 1 unchecked "Sponsorship interest".
- **Privacy footnote**: lock icon + "Your information is secure and will only be used to match you with relevant local partners."
- **Confirmation card (Step 3)**: pale-green panel, green 1 px border, ~10 px radius; centered green circle with white check; bold "Thank you! Your business request has been submitted."; boxed monospace-styled Request ID `TIDRC-PR-2025-000124` in a lighter inset; 3 icon bullet lines (person icon: "Our team will review your request and identify suitable local contacts."; envelope: "You will receive a confirmation email shortly."; clock: "We typically respond within 2–3 business days."); outlined button "Submit Another Request"; text link "Browse the Directory First →".
- **Footer**: navy; logo + 2-line description ("Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo."); columns Quick Links (Companies, Opportunities, Products, Local Contacts), Resources (Market Intelligence, Promote Your Business, News & Insights, Help Center), Company (About Us, Terms of Use, Privacy Policy, Contact Us); BrandsBridge logo; 4 circular outlined social icons (LinkedIn, Twitter, YouTube, Email). Bottom strip: "© 2024 Trade in DRC. All rights reserved." | "Trade in DRC — Connecting international business with local opportunities." | "www.tradeindrc.com".

## 6. Borders, radii, shadows & effects

- Corner radius convention: small — 4–8 px on buttons/inputs/tiles, ~10 px on the confirmation card. Nothing pill-shaped.
- Strokes: uniform hairline 1 px light-gray borders on all tiles, inputs, cards; dashed 1 px border only on the upload dropzone.
- Shadows: very subtle (or none) on tiles/cards — the design relies on borders, not elevation.
- Hero photo blends into the navy via a left-side gradient/feather (navy → transparent) rather than a hard mask.
- No glassmorphism, no gradient fills on buttons; flat institutional style. The only decorative effect is the faint ghost duplicate behind the H1.

## 7. Imagery & iconography

- **One photograph**: two businessmen (one Black, one white — deliberate international+local symbolism) shaking hands in suits, high-rise office backdrop with a river/city skyline (evokes Kinshasa/Congo River). Natural color, slight cool grade to sit with the navy; feathered left edge into the hero background.
- **Icons**: consistent thin **line icons** (~1.5 px stroke, rounded joins) for the 8 need tiles (box/truck/person/handshake/gear/bank/globe/package), the ⓘ info marker, lock, upload cloud, and the 3 confirmation bullets (person/envelope/clock). Social icons: white glyphs in ~32 px circular outline buttons.
- **Logos**: TradeInDRC mark = DRC map silhouette with blue/red split + handshake; BrandsBridge = magenta/pink interlocking X.

## 8. Content & copy

Key strings (EN):
- H1: "Find a Local Partner in the DRC"
- Hero body: "Tell us what your business needs, Trade in DRC will help identity suitable local companies, representatives, distributors or service providers aligned with your project." *(note customer typo: "identity" → should be "identify")*
- CTAs: "Submit Your Need", "Browse the Directory First", "Register Your Company", "Request a Partner"
- Steps: "1 What do you need? — Select the type of partner or contact you are looking for." / "2 Tell us about your business need — Provide details so we can match you with the right local contacts." / "3 Request Submitted — Your request has been received successfully."
- Request ID format: `TIDRC-PR-2025-000124`
- Reassurances: "Your information is secure and will only be used to match you with relevant local partners." / "We typically respond within 2–3 business days."
Tone: service-desk professional, direct, benefit-plain; second person ("Tell us…", "You will receive…"). English only — FR variant will be needed.

## 9. UX assessment

**Works well**
- The 1-2-3 progressive narrative is instantly scannable; numbered navy badges anchor each column.
- Clear single primary action color (yellow) in hero and nav; green strictly for success — good semantic discipline.
- Trust scaffolding is strong: verified-only checkbox, privacy lock line, Request ID, explicit SLA (2–3 business days).
- Required-field marking and grouped form columns keep a 13-field form feeling manageable.

**Risky / to fix**
- Showing all 3 steps at once is a mockup convention; the live page should be a **stepper/wizard** (or reveal step 3 only post-submit) — a permanently visible "Request Submitted" card is confusing and fakes state.
- The 2×4 tile column + wide form + confirmation column will not fit on tablet; needs a stacked responsive flow.
- Hero white text over the photo's bright sky region could dip below AA at some breakpoints — keep the navy gradient scrim.
- "Power by" (topbar/footer) and "help identity" are copy errors; H1 ghost-echo artifact should be removed.
- 8 need tiles with single-select behavior must read as radio buttons (selected state: blue border + tint), not links.
- Phone/country/province selects need proper i18n data (DRC's 26 provinces) and validation messaging not shown in the mock.
- Contrast of light-gray placeholder text (~#9CA3AF on #F7F8FA) is below AA — acceptable for placeholders only if labels persist.

## 10. Mapping to TradeInDRC site

- **Route**: maps to the existing **`/[locale]/request`** page (customer batch 2026-06-04 "Request page"; nav "Local Contacts" / "Request a Partner"). Alternatively a dedicated `/[locale]/local-contacts/request`.
- **Data**: submission → Supabase table (extend the existing request/`opportunities`-adjacent schema from migration 00022); generate Request ID `TIDRC-PR-YYYY-NNNNNN` server-side (sequence or padded serial); file upload → Supabase Storage bucket with 10 MB limit + MIME whitelist (pdf/doc/docx/pptx).
- **Implementation notes (Tailwind/shadcn)**:
  - Hero: navy section `bg-[#0B1F60]`, right image with `bg-gradient-to-r from-[#0B1F60] via-[#0B1F60]/70 to-transparent` overlay; buttons via shadcn `Button` variants (yellow primary custom variant, `outline` white secondary).
  - Step 1 tiles: `RadioGroup` styled as cards (`grid grid-cols-2 gap-3`), lucide icons (Package, Truck, UserRound, Handshake, Settings, Landmark, Globe, Boxes); selected state `border-blue-600 bg-blue-50`.
  - Step 2: `react-hook-form` + `zod`; shadcn `Input`, `Select`, `Textarea`, `Checkbox`; dropzone via native input + dashed `border-dashed` card. Two-column `md:grid-cols-2` collapsing to one.
  - Step 3: render **conditionally after successful submit** (replace columns 1–2 or route to `/request/success?id=`), with Sonner toast per NON_BLOCKING_UX (`toast.loading → success`).
  - Convert the 3-column mock into a responsive stepper: desktop can keep side-by-side steps 1+2 with a sticky summary; mobile stacks.
  - i18n: all strings through next-intl (`en`/`fr`); fix "identity"→"identify", "Power by"→"Powered by".
  - Motion: per `docs/MOTION.md` — subtle mount fade on step columns ≤300 ms, tile hover ≤180 ms border/tint transition only.
