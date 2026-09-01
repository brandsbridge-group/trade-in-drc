# Register Your Company (Local Business Contact) — design 6 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/6.pdf` (source: `6.ai`, 1 artboard, desktop)
- Design analysis: `latest-designs/6-register-local-business-contact.md`
- App routes / key files:
  - `src/app/[locale]/(auth)/register/page.tsx` → `src/components/registration/registration-form.tsx` + `src/components/registration/step-*.tsx` + `src/components/registration/progress-bar.tsx` + `src/lib/registration/schema.ts`
  - `src/app/[locale]/(public)/pricing/page.tsx` (+ `src/components/pricing/premium-cta.tsx`, `actions.ts`)
  - `src/app/[locale]/dashboard/companies/page.tsx`
  - Messages: `src/config/messages/en.json` → `Pricing`, `Registration`, `Auth` namespaces

## THE DESIGN SPEC

One dense, single-scroll landing page that fuses **marketing hero + 3-tier pricing + 5-step registration wizard + benefit strip** — the supply-side acquisition funnel for Congolese companies. Deep-navy government-trust look with DRC-flag accent colors (sky blue `#7EC8F2`, red `#D32027`, gold `#F5A623`, green `#2E9E4F`) over navy `#0A1F44/#0B2447`; light-gray body `#F2F5F9`.

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

### 1. Utility bar (near-black navy `#061229`)
Logo lockup (flag-color bar-chart mark + "Trade in DRC" + tri-color tagline "Connect – invest – Grow") left; "Power by BrandsBridge Group" partner lockup right.

### 2. Primary nav (dark navy)
Text links: Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact. Right: **gold filled button "Register Your Company"** (navy text, radius ~4pt) + **light-blue button "Request a Partner"**. Gold is reserved exclusively for the top-conversion CTA.

### 3. Hero (~210pt, photographic navy)
- H1 white ~34pt semibold, two lines: **"Register Your Company as a Local Business Contact"**.
- Subline: "Put your Company in front of business partners looking for opportunities in the DRC."
- Row of **3 icon-bullet value props** (thin circular outline icons): "Increase visibility — Be found by verified buyers and partners." / "Build Trust — Get verified and stand out in the marketplace." / "Grow in DRC — Generate qualifed requests and new business."
- Right 40%: **photo of smiling Congolese businessman in navy suit, arms crossed, laptop, DRC national flag on pole**, navy multiply overlay fading left→right so the text zone stays dark.

### 4. Pricing tier row (3 cards, floating overlap over hero seam)
White cards, thin **navy 1pt border + solid navy top strip (~6pt)** — the signature card detail — radius ~6pt, soft shadow. Each: line icon (bank / shield-check / crown), tier name, big navy price, blurb, ✓ checklist, full-width CTA:
- **"Registered Listing — FREE"** — "Basic company listing to get discovered by local and international partners" — ✓ Basic company profile / Listed in directory search / Receive partnership requests — outline CTA **"Select Free Listing"**.
- **"Verified Company — USD 250"** — "Verified badge builds trust and increases visibility with more details" — ✓ All Registered Listing benefits / Verified badge / Enhanced profile visibility / Priority in search results — solid navy **"Choose Verified"**.
- **"Premium Local Partner — USD 3,000 /year"** — "Maximum visibility, lead access and featured placement" — ✓ All Verified Company benefits / Featured placement / Lead insights & analytics / Dedicated support — solid navy **"Choose Premium"**.

### 5. Stepper (5 nodes with chevron separators)
Numbered circles (active = solid navy filled "1", inactive = gray outline), labels beside each: **Legal Information → Professional Information → Partnership Positioning → Documents Upload → Review & Submit**.

### 6. Form panel (large white card, 4 columns, hairline dividers)
All-caps navy section headers with line-icon prefixes; inputs white, hairline border, radius ~3pt; red `*` on required fields.
- **1. LEGAL INFORMATION**: Company Legal Name*, Trading Name (if different), RCCM Number*, National Identification Number*, Tax Identification Number (NIF)*, Year Established* (select), Legal Form (select), Number of Employees (select range).
- **2. PROFESSIONAL INFORMATION**: Sector* (select), Products / Services*, Province* (select), City* (select), Website, Official Email*, Phone Number* with **"+243 ▾" prefix segment**, Alternative Phone (+243).
- **3. PARTNERSHIP POSITIONING**: Contact Person*, Job Title* ("e.g. Managing Director"), Preferred Contact (select), Languages Spoken as **light-blue removable chips** (French ×, English ×, Swahili ×), **"International Opportunities of Interest" checkbox list**: Investment Partnerships / Distribution Agreements / Supply & Procurement / Joint Ventures / Technology Transfer / Other (please specify) + free-text.
- **4. DOCUMENTS UPLOAD**: helper "Upload clear, legible documents (PDF, JPG or PNG, Max 5MB per file)"; **4 dashed-border dropzones** ("Drag & drop or **Browse**" blue link): RCCM Certificate*, Tax Identification (NIF)*, Company Logo (Optional), Additional Documents (Optional).
(The comp shows steps 1–4 side by side as a scope illustration; the 5-node stepper confirms a true one-step-at-a-time wizard.)

### 7. Benefit strip (light-gray band, 4 cells, hairline vertical dividers)
Circular thin-line navy icons + bold title + gray 2-line blurb: **High Visibility** ("Appear in front of thousands of buyers and investors.") / **Verified & Trusted** ("Build credibility with verification and trusted profile badges.") / **Receive Opportunities** ("Get connection requests from serious partners and buyers.") / **Grow Your Business** ("Access new markets and scale within the DRC.").

### 8. Footer (dark navy) + sub-footer
Logo + mission paragraph ("Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo."); 3 link columns (Quick Links, Resources, Company); "Power by BrandsBridge Group"; 4 white circular social icons (LinkedIn, X, YouTube, Email). Sub-footer bar: "© 2024 Trade in DRC. All rights reserved." / "Trade in DRC – Connecting international business with local opportunities." / "www.tradeindrc.com".

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Utility bar + "Power by BrandsBridge" | Near-black strip, dual-brand lockups | ❌ | — | No utility bar, no BrandsBridge co-brand anywhere |
| Gold "Register Your Company" nav CTA | Gold `#F5A623` filled, navy text | 🟡 | `src/config/navigation.ts` / navbar | Register entry exists in nav, but no gold reserved-CTA treatment |
| "Request a Partner" nav CTA | Light-blue `#7EC8F2` filled button | 🟡 | Request page (customer batch 2026-06-04) | Exists as a page, not a paired nav CTA in this layout |
| Hero H1 "Register Your Company as a Local Business Contact" | White ~34pt on navy photo | ❌ | — | Register page is an auth card (`AuthShell`/`AuthFormCard`); pricing hero says "Choose the Right Profile for Your Business" on white |
| Hero businessman + DRC flag photo, navy overlay | Full-bleed photo right 40% | 🟡 | `pricing/page.tsx` L85–97 (`/images/hero/hero-pricing.jpg`) | Framed rounded-2xl photo card on a white hero — not a navy photographic band |
| 3 hero value-prop icon bullets (Increase visibility / Build Trust / Grow in DRC) | Circular outline icons, white text | ❌ | — | Absent on both register and pricing pages |
| Pricing card "Registered Listing — FREE" | Bank icon, navy top strip, 3 ✓, outline "Select Free Listing" | 🟡 | `pricing/page.tsx` `PlanCard` (L238–288) | "Free Registration / Free", 5 features, "Start Free"; slate rounded-2xl card — no navy border/top strip, no tier icon |
| Pricing card "Verified Company — USD 250" | Shield icon, one-time USD 250, "Choose Verified" | ❌ | — | No USD 250 middle tier; app tiers are Free / $3,000 Congolese / $3,600 International |
| Pricing card "Premium Local Partner — USD 3,000 /year" | Crown icon, solid navy "Choose Premium" | 🟡 | `pricing/page.tsx` premiumCongolese + `premium-cta.tsx` | Price matches ($3,000/year) but named "Premium Profile — Congolese Companies", 8 features, "Recommended" pill instead of crown/navy-strip styling |
| Cards overlapping the hero seam | ~30pt float over dark/light boundary | ❌ | — | Cards sit in a normal section below the hero |
| 5-step stepper, numbered circles + chevrons | Navy filled active circle, ">" separators | 🟡 | `registration/progress-bar.tsx` | 6-step flow (Basic Info, Contact, Products, Documents, Branding, Review) rendered as thin segment bars + tiny labels — no circles, no chevrons, different step names |
| One-step-at-a-time wizard with persisted state | Implied by stepper | ✅ | `registration-form.tsx` + `src/lib/registration/store` | Pattern matches (6 steps vs design's 5) |
| Legal Info fields (Legal Name, Trading Name, RCCM*, National ID*, NIF*, Year Established, Legal Form, Employees) | 2-col micro-grid | 🟡 | `src/lib/registration/schema.ts` `basicInfoSchema` | Only name + sector + description collected; **no RCCM, NIF, national ID, year established, legal form, employee count** |
| Professional Info fields (Sector, Products/Services, Province, City, Website, Official Email, Phone +243, Alt Phone) | Selects + "+243 ▾" prefix | 🟡 | `contactSchema` + `step-products.tsx` | Sector/products/province/city/website/email/phone all exist across steps; province/city are free text, no +243 prefix segment, no alternative phone |
| Partnership Positioning (Contact Person, Job Title, Preferred Contact, language chips FR/EN/SW, opportunity-interest checkboxes) | Blue removable chips + 6-item checkbox list | ❌ | — | Entire step absent |
| Documents Upload: 4 dashed dropzones (RCCM Cert*, NIF*, Logo, Additional) + 5MB helper | Dashed border, blue "Browse" link | 🟡 | `step-documents.tsx` + `step-branding.tsx` (businessLicense, taxRegistration, proofOfAddress; logo, photos) | Uploads exist but document set differs (not RCCM/NIF-named), split across two steps |
| Review & Submit step | Step 5 | ✅ | `step-review.tsx` | Present (as step 6) |
| Tier selection carried into the form | Pricing → wizard connection | ❌ | — | `/pricing` and `/register` are disconnected; no selected-tier state, `PremiumCta` is a separate purchase path |
| Benefit strip (High Visibility / Verified & Trusted / Receive Opportunities / Grow Your Business) | 4 cells, hairline dividers | 🟡 | `pricing/page.tsx` "Why Go Premium" (L150–178) | 6 tile cards in a 3-col grid, square icon chips, different copy; nothing on the register page |
| Dark navy footer w/ BrandsBridge + socials + sub-footer bar | 4-col navy, white circle icons | 🟡 | Global `Footer` component | Footer exists but no BrandsBridge lockup or "www.tradeindrc.com" sub-footer bar |
| Navy/gold DRC-flag color system | `#0A1F44` bands, gold CTA economy | 🟡 | Tailwind `primary` tokens | Light slate/white system; no gold tier, no navy hero/footer bands on these pages |

## ❌ Design elements the app lacks entirely

**Marketing shell for registration**
- Navy photographic hero (businessman + DRC flag) with H1 + subline — static asset + copy only.
- 3 hero value-prop icon bullets — copy/i18n keys only.
- Benefit strip on the registration surface — copy only.
- BrandsBridge Group co-brand (utility bar + footer) — confirm contractually, then nav/footer config.

**Pricing ladder**
- "Verified Company — USD 250" one-time middle tier — implies a new plan in pricing `actions.ts`/DB (current premium flow knows only congolese/international $3,000/$3,600) plus a verification-tier value.
- Tier icons (bank/shield/crown), navy top-strip card styling, hero-seam overlap — pure CSS.
- Pricing → wizard handoff (selected tier + payment step for paid tiers) — tier field in the registration store + payment integration.

**Form scope (biggest functional gap)**
- Legal-identity fields: RCCM Number, National ID, NIF, Trading Name, Year Established, Legal Form, Number of Employees — implies new `companies` columns/migration.
- Partnership Positioning step: contact person, job title, preferred contact, Languages Spoken chips, "International Opportunities of Interest" taxonomy — implies new columns/join table.
- RCCM/NIF-named dropzones, "+243 ▾" phone prefix, province/city selects — storage naming + a provinces/cities reference list.

## 🎨 Visual-language delta

The design is a **dark-navy institutional landing page**; the app's register/pricing surfaces are a **light, minimal shadcn system**. The design bookends the page with navy `#0A1F44` photographic/solid bands and reserves gold `#F5A623` for the single money CTA — the app has no navy bands and no gold anywhere (all CTAs are `primary`/outline). Design cards carry a signature navy 1pt border + ~6pt navy top strip at ~6pt radius; app cards are slate `rounded-2xl` with a "Recommended" ring. The design's stepper is numbered navy circles with chevrons; the app uses anonymous progress segments. The design is extremely dense (five stacked bands, ~25 visible fields on one artboard); the app splits the same funnel across three sparse pages (`/pricing`, `/register`, dashboard). Note: project memory records a customer **light-theme preference** — the navy bands should be reconciled with them, but as drawn the comp is far darker and denser than the app.

## 🔷 App features the design omits (regression watch-list)

- Auth gating + email-verified RLS handling (`register/page.tsx` redirect; RLS error → `/verify-email`) — the design shows no auth at all.
- Step 3 Products (multi-product entries with categories) and Step 5 Branding (photo gallery) — richer than the design's single "Products / Services" field.
- Proof-of-address document requirement.
- $3,600 International Premium tier, "Custom package" contact section, 6-tile "Why Go Premium", bottom join banner.
- Framer-motion section enters with reduced-motion support; toast-driven submit UX.
- Full EN/FR i18n (the comp is EN-only).

## Verdict

**matchScore: 40**

The bones of the funnel exist — a real 6-step registration wizard with Zustand state, document/logo uploads, and a 3-card pricing page with a free tier and a $3,000/year premium — so the design is not starting from zero. But almost nothing *looks* like the comp: no navy hero with the businessman/DRC-flag photo, no gold CTA system, no navy-strip pricing cards, no numbered stepper, and the register page is an auth card rather than a marketing landing page. Functionally, the design's DRC-specific legal fields (RCCM, NIF, legal form, employees) and the entire Partnership Positioning step (language chips, opportunity-interest checkboxes) are absent, the USD 250 "Verified Company" tier doesn't exist, and pricing and registration are two disconnected pages instead of one connected funnel. Adopting the design means a unified `/register-company` landing surface, a schema migration for legal-identity fields, and a tier-selection → wizard → payment handoff — plus reconciling the USD 250 tier and the navy look with the previously approved $3,000/$3,600 packages and the customer's light-theme preference.
