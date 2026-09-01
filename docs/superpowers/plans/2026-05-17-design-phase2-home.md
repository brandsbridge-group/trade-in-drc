# Design Phase 2 — Home Page Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) syntax.

**Goal:** Replace the current AI-template `/[locale]` home page with a TurkishExporter-density landing built entirely from Phase 1 primitives. Brand-blue hero + featured opportunity strip + tabbed product/company explorer + RFQ CTA + brand-logo carousel + FAQ + new footer.

**Architecture:** New page composed of 9 stacked sections (see DESIGN.md §3.1). Each section is a small subcomponent under `src/components/home/`. The page itself stays a Server Component that fetches data once and passes it down. Data lookups are best-effort: every fetch swallows errors and falls back to empty arrays so the page never 500s if a migration isn't applied yet.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind v4, lucide-react, Phase 1 primitives.

**Reference spec:** `DESIGN.md` §3.1 (Home) + §3.17 (Footer) + §6 (drop list).

**No commits per task** — orchestrator runs verify + ship-wreck + single commit on `main` at the end.

---

## File Structure

**Create:**
- `src/components/home/hero-section.tsx` — server component; renders the brand-blue hero with `<HeroSearch>` left + `<HeroMockupCard>` right.
- `src/components/home/alert-ribbon.tsx` — client (dismissible).
- `src/components/home/featured-opportunities-section.tsx` — server; queries 5 latest published opportunities + renders `<FeaturedOpportunityStrip>`.
- `src/components/home/explorer-section.tsx` — client; tab switcher between Products / Companies / Opportunities, fetches via Supabase browser client on tab change.
- `src/components/home/latest-block.tsx` — server; left "Latest products" carousel (CSS scroll-snap, reuses Phase 1 patterns) + right "Latest databank" feed.
- `src/components/home/rfq-cta-section.tsx` — server; thin wrapper around `<RfqCtaBanner>`.
- `src/components/home/brand-carousel-section.tsx` — server; queries verified-tier companies, passes their logos to `<BrandLogoCarousel>`.
- `src/components/home/faq-section.tsx` — server; static 5-question accordion using bilingual i18n keys.
- `src/components/home/site-footer.tsx` — server; new footer layout per DESIGN.md §3.17.
- `src/components/home/__tests__/explorer-section.test.tsx` — RTL: tab switching renders the corresponding empty-state by default.

**Modify:**
- `src/app/[locale]/page.tsx` — full rewrite. Becomes a thin composer that fetches data once and renders the 9 sections.
- `src/app/[locale]/layout.tsx` — replace any existing `<Footer />` mount with the new `<SiteFooter />`. Confirm Navbar import stays unchanged.
- `src/config/messages/en.json` + `fr.json` — add `Home.*` namespace (alert ribbon text, FAQ q&a, "Latest products"/"Latest databank" headers, brand-carousel section title, footer copy).
- `src/components/Navbar.tsx` (or wherever the navbar lives — TBD by recon in T2) — **NO content changes**; only remove any conflicting bottom-margin or duplicate hero spacer if it exists.

**Delete (move to `_archive/` first, then remove in same commit):**
- Any existing home sections we replace (`Hero.tsx`, `Stats.tsx`, `Features.tsx`, `RisingPotential.tsx`, `RfqFeed.tsx`, `SupplierSpotlight.tsx`, `TradeHub.tsx`, etc.) — list determined by recon in Task 1.
- The current `Footer.tsx` if it doesn't match the new layout. (If it does, keep it.)

---

## Task 1: Recon — list current home composition

**Files:** none (read-only)

- [ ] **Step 1:** Read `src/app/[locale]/page.tsx` fully and list every section component it renders.
- [ ] **Step 2:** Read each section component imported from `src/components/` to verify it isn't used elsewhere (grep for imports). Components used ONLY by the home page are safe to delete; those reused elsewhere stay until later phases.
- [ ] **Step 3:** Identify the current `<Footer />` import path and check if it's also used in other layouts (admin, dashboard).
- [ ] **Step 4:** Output a concise table in the dispatch report:

```
delete-only-used-on-home: ComponentA, ComponentB, …
keep-used-elsewhere:      ComponentX, ComponentY
footer-path:              src/components/Footer.tsx (or wherever)
footer-reused:            yes/no
```

This recon informs subsequent tasks. The implementing agent for T2+ will use this list.

---

## Task 2: `Home.*` i18n namespace

**Files:**
- Modify: `src/config/messages/en.json`
- Modify: `src/config/messages/fr.json`

- [ ] **Step 1: EN — add `Home` top-level key**

```json
"Home": {
  "alert": "Verified Congolese exporters · Send RFQs free",
  "alertDismiss": "Dismiss",
  "hero": {
    "tagline": "The official DRC trade portal",
    "headline": "Find verified exporters, send RFQs, close deals.",
    "subline": "Bilingual platform for buyers and suppliers connecting the Democratic Republic of Congo to the world."
  },
  "featured": { "title": "Live opportunities" },
  "explorer": {
    "title": "Explore the marketplace",
    "tabs": { "products": "Products", "companies": "Companies", "opportunities": "Opportunities" },
    "viewAll": "View all"
  },
  "latest": {
    "productsTitle": "Latest products",
    "databankTitle": "Latest databank",
    "productsViewAll": "More products",
    "databankViewAll": "More databank"
  },
  "rfqCta": "Submit an RFQ — receive offers from verified DRC companies",
  "brands": { "title": "Verified Congolese exporters" },
  "faq": {
    "tag": "FAQ",
    "title": "Some things you might want to know",
    "subtitle": "We answered the questions so you don't have to ask.",
    "items": {
      "q1": { "q": "How do I become a verified exporter?", "a": "Register, complete your company profile, upload KYB documents in the dashboard, and our team reviews within 5 business days." },
      "q2": { "q": "How do I send an RFQ?", "a": "Log in, open any company or opportunity, and click 'Send RFQ'. You can also broadcast an RFQ to every verified company on a list page." },
      "q3": { "q": "Is the platform free?", "a": "Yes. Registration, browsing, and basic RFQs are free. Premium verification tiers and analytics are optional." },
      "q4": { "q": "What languages are supported?", "a": "English and French today. Turkish, Chinese, and Spanish are planned." },
      "q5": { "q": "How do I contact a company?", "a": "Open the company profile and click 'Message company' to start a conversation thread. Verified companies typically respond within 48 hours." }
    },
    "helpCenter": "Help center"
  },
  "footer": {
    "tagline": "DRC bilingual trade portal",
    "columns": {
      "platform": { "title": "Platform", "directory": "Companies", "products": "Products", "opportunities": "Opportunities", "marketplace": "Marketplace" },
      "resources": { "title": "Resources", "dataHub": "Data Hub", "trust": "Trust Center", "news": "News", "blog": "Blog" },
      "company": { "title": "Company", "about": "About", "contact": "Contact", "faq": "FAQ", "help": "Help" },
      "legal": { "title": "Legal", "privacy": "Privacy", "terms": "Terms", "cookies": "Cookies" }
    },
    "copyright": "© {year} TradeInDRC. All rights reserved."
  }
}
```

- [ ] **Step 2: FR equivalent** (keep structure identical; translate values).

FR translation values:
- alert → "Exportateurs congolais vérifiés · Envoyez des RFQ gratuitement"
- alertDismiss → "Fermer"
- hero.tagline → "Le portail officiel du commerce de la RDC"
- hero.headline → "Trouvez des exportateurs vérifiés, envoyez des RFQ, concluez des affaires."
- hero.subline → "Plateforme bilingue qui connecte acheteurs et fournisseurs de la République démocratique du Congo au monde."
- featured.title → "Opportunités en direct"
- explorer.title → "Explorez la place de marché"
- explorer.tabs.products/companies/opportunities → "Produits" / "Entreprises" / "Opportunités"
- explorer.viewAll → "Voir tout"
- latest.productsTitle / databankTitle → "Derniers produits" / "Dernière base de données"
- latest.productsViewAll / databankViewAll → "Plus de produits" / "Plus de base de données"
- rfqCta → "Soumettez un RFQ — recevez des offres d'entreprises congolaises vérifiées"
- brands.title → "Exportateurs congolais vérifiés"
- faq.tag → "FAQ"
- faq.title → "Quelques questions que vous pourriez vous poser"
- faq.subtitle → "Nous y avons répondu pour vous éviter d'avoir à les poser."
- faq.items.q1 → q: "Comment devenir exportateur vérifié ?" / a: "Inscrivez-vous, complétez le profil d'entreprise, téléversez les pièces KYB dans le tableau de bord. Notre équipe examine sous 5 jours ouvrés."
- faq.items.q2 → q: "Comment envoyer un RFQ ?" / a: "Connectez-vous, ouvrez une entreprise ou opportunité et cliquez sur « Envoyer un RFQ ». Vous pouvez aussi diffuser un RFQ à toutes les entreprises vérifiées d'une liste."
- faq.items.q3 → q: "La plateforme est-elle gratuite ?" / a: "Oui. L'inscription, la navigation et les RFQ de base sont gratuits. Les niveaux de vérification premium et l'analyse avancée sont optionnels."
- faq.items.q4 → q: "Quelles langues sont prises en charge ?" / a: "Anglais et français aujourd'hui. Turc, chinois et espagnol sont prévus."
- faq.items.q5 → q: "Comment contacter une entreprise ?" / a: "Ouvrez le profil d'entreprise et cliquez sur « Contacter l'entreprise » pour lancer un fil de discussion. Les entreprises vérifiées répondent généralement sous 48 heures."
- faq.helpCenter → "Centre d'aide"
- footer.tagline → "Portail commercial bilingue de la RDC"
- footer.columns.platform.title → "Plateforme"; directory → "Entreprises"; products → "Produits"; opportunities → "Opportunités"; marketplace → "Place de marché"
- footer.columns.resources.title → "Ressources"; dataHub → "Centre de données"; trust → "Centre de confiance"; news → "Actualités"; blog → "Blog"
- footer.columns.company.title → "À propos"; about → "À propos"; contact → "Contact"; faq → "FAQ"; help → "Aide"
- footer.columns.legal.title → "Mentions légales"; privacy → "Confidentialité"; terms → "CGU"; cookies → "Cookies"
- footer.copyright → "© {year} TradeInDRC. Tous droits réservés."

- [ ] **Step 3: Verify**

```bash
node -e "const e=require('./src/config/messages/en.json'); console.log(e.Home.faq.items.q1.q, '|', e.Home.footer.columns.platform.title)"
node -e "const f=require('./src/config/messages/fr.json'); console.log(f.Home.faq.items.q1.q, '|', f.Home.footer.columns.platform.title)"
```

---

## Task 3: `AlertRibbon` (client, dismissible)

**Files:**
- Create: `src/components/home/alert-ribbon.tsx`

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export function AlertRibbon() {
  const t = useTranslations("Home");
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="bg-primary text-primary-foreground text-xs">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
        <p>{t("alert")}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("alertDismiss")}
          className="opacity-70 hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
```

---

## Task 4: `HeroSection`

**Files:**
- Create: `src/components/home/hero-section.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { HeroSearch, HeroMockupCard } from "@/components/design";

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.hero" });
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80 mb-2">{t("tagline")}</p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3 max-w-xl">{t("headline")}</h1>
          <p className="text-sm opacity-90 mb-6 max-w-md">{t("subline")}</p>
          <HeroSearch />
        </div>
        <HeroMockupCard locale={locale} />
      </div>
    </section>
  );
}
```

---

## Task 5: `FeaturedOpportunitiesSection`

**Files:**
- Create: `src/components/home/featured-opportunities-section.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FeaturedOpportunityStrip } from "@/components/design";
import type { Opportunity } from "@/lib/opportunities/types";

export async function FeaturedOpportunitiesSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.featured" });
  const supabase = await createServerSupabaseClient();
  let items: Opportunity[] = [];
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5);
    items = ((data ?? []) as unknown as Opportunity[]);
  } catch { /* migrations may not be applied yet — silent */ }
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>
      <FeaturedOpportunityStrip items={items} locale={locale} />
    </section>
  );
}
```

---

## Task 6: `ExplorerSection` (tabbed, client) + test

**Files:**
- Create: `src/components/home/explorer-section.tsx`
- Create: `src/components/home/__tests__/explorer-section.test.tsx`

- [ ] **Step 1: explorer-section.tsx**

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { EmptyState } from "@/components/design";

type Tab = "products" | "companies" | "opportunities";

export function ExplorerSection() {
  const t = useTranslations("Home.explorer");
  const [tab, setTab] = useState<Tab>("products");
  const tabs: Tab[] = ["products", "companies", "opportunities"];

  // V1: each tab links the user out to the full section. The grid stays empty until
  // a real prefetch flow exists. This still shows the tabbed exploration pattern.
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <div className="flex gap-1">
          {tabs.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 text-xs rounded-md border ${tab === k ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
              aria-pressed={tab === k}
            >
              {t(`tabs.${k}`)}
            </button>
          ))}
        </div>
        <Link href={`/${tab === "products" ? "products" : tab === "companies" ? "companies" : "opportunities"}`} className="text-xs underline text-muted-foreground">
          {t("viewAll")}
        </Link>
      </div>
      <EmptyState title={t(`tabs.${tab}`)} body={`${t("viewAll")} →`} />
    </section>
  );
}
```

- [ ] **Step 2: explorer-section.test.tsx**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
}));

vi.mock("@/i18n/routing", () => ({
  Link: (props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a {...props} />,
}));

import { vi } from "vitest";
import { ExplorerSection } from "../explorer-section";

describe("ExplorerSection", () => {
  it("starts on products tab", () => {
    render(<ExplorerSection />);
    expect(screen.getByRole("button", { name: /tabs\.products/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("switches to opportunities on click", () => {
    render(<ExplorerSection />);
    fireEvent.click(screen.getByRole("button", { name: /tabs\.opportunities/i }));
    expect(screen.getByRole("button", { name: /tabs\.opportunities/i })).toHaveAttribute("aria-pressed", "true");
  });
});
```

(Note: order the `import` and `vi.mock` so that vi.mock is hoisted properly. The above pattern matches the existing `src/lib/auth/require-admin.test.ts` from S1.)

- [ ] **Step 3:** Run `npx vitest run src/components/home/__tests__/explorer-section.test.tsx` → 2 PASS.

---

## Task 7: `LatestBlock`

**Files:**
- Create: `src/components/home/latest-block.tsx`

Two-column block: left = latest products mini-rail (top 3 products as `<ProductCardDesign>`); right = latest databank items (top 3 published opportunities as small rows with country emoji + title).

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCardDesign } from "@/components/design";

interface ProductLite {
  id: string;
  name: string;
  image_url?: string | null;
  company_id: string;
  companies?: { name: string } | null;
}

interface OppLite {
  id: string;
  title_en: string;
  title_fr: string;
  category: string;
  slug: string;
  region: string | null;
  published_at: string | null;
}

export async function LatestBlock({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.latest" });
  const supabase = await createServerSupabaseClient();
  let products: ProductLite[] = [];
  let opps: OppLite[] = [];
  try {
    const { data } = await supabase
      .from("products")
      .select("id, name, image_url, company_id, companies(name)")
      .order("created_at", { ascending: false })
      .limit(3);
    products = ((data ?? []) as unknown as ProductLite[]);
  } catch {}
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title_en, title_fr, category, slug, region, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);
    opps = ((data ?? []) as unknown as OppLite[]);
  } catch {}
  return (
    <section className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t("productsTitle")}</h2>
          <Link href="/products" className="text-xs underline text-muted-foreground">{t("productsViewAll")}</Link>
        </div>
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground border rounded-md p-4">—</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
              <ProductCardDesign key={p.id} item={{
                id: p.id, name: p.name, image_url: p.image_url ?? null,
                company_id: p.company_id, company_name: p.companies?.name ?? null,
              }} />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{t("databankTitle")}</h2>
          <Link href="/opportunities" className="text-xs underline text-muted-foreground">{t("databankViewAll")}</Link>
        </div>
        {opps.length === 0 ? (
          <p className="text-xs text-muted-foreground border rounded-md p-4">—</p>
        ) : (
          <ul className="space-y-2">
            {opps.map((o) => {
              const title = locale === "fr" ? o.title_fr : o.title_en;
              return (
                <li key={o.id}>
                  <Link href={`/opportunities/${o.category}/${o.slug}`} className="block border rounded-md p-3 bg-card hover:bg-muted/40">
                    <p className="text-sm font-medium line-clamp-1">{title}</p>
                    {o.region && <p className="text-xs text-muted-foreground">{o.region}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
```

---

## Task 8: `RfqCtaSection`

**Files:**
- Create: `src/components/home/rfq-cta-section.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { RfqCtaBanner } from "@/components/design";

export async function RfqCtaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const td = await getTranslations({ locale, namespace: "Design" });
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <RfqCtaBanner
        title={t("rfqCta")}
        action={
          <Link href="/dashboard/opportunities/new" className="text-sm bg-white text-primary px-3 py-1.5 rounded-md font-medium">
            {td("rfqBanner.action")}
          </Link>
        }
      />
    </section>
  );
}
```

---

## Task 9: `BrandCarouselSection`

**Files:**
- Create: `src/components/home/brand-carousel-section.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BrandLogoCarousel } from "@/components/design";

interface CompanyLogo {
  id: string;
  name: string;
  logo_url?: string | null;
}

export async function BrandCarouselSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.brands" });
  const supabase = await createServerSupabaseClient();
  let logos: CompanyLogo[] = [];
  try {
    const { data } = await supabase
      .from("companies")
      .select("id, name, logo_url, verification_tier")
      .eq("status", "verified")
      .in("verification_tier", ["verified", "premium"])
      .order("verified_at", { ascending: false })
      .limit(20);
    logos = ((data ?? []) as unknown as CompanyLogo[]);
  } catch {}
  if (logos.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-sm font-semibold mb-3">{t("title")}</h2>
      <BrandLogoCarousel logos={logos} />
    </section>
  );
}
```

---

## Task 10: `FaqSection`

**Files:**
- Create: `src/components/home/faq-section.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function FaqSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.faq" });
  const items = ["q1", "q2", "q3", "q4", "q5"] as const;
  return (
    <section className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-xs uppercase tracking-wide text-primary mb-2">{t("tag")}</p>
      <h2 className="text-2xl font-semibold mb-2">{t("title")}</h2>
      <p className="text-sm text-muted-foreground mb-8">{t("subtitle")}</p>
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {items.map((k) => (
          <details key={k} className="border rounded-md p-3 group bg-card">
            <summary className="text-sm font-medium cursor-pointer flex items-center justify-between">
              <span>{t(`items.${k}.q`)}</span>
              <span className="text-muted-foreground group-open:rotate-180 transition" aria-hidden>⌃</span>
            </summary>
            <p className="text-xs text-muted-foreground mt-2">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/faq" className="inline-block text-xs bg-foreground text-background px-4 py-2 rounded-md">{t("helpCenter")}</Link>
      </div>
    </section>
  );
}
```

---

## Task 11: `SiteFooter`

**Files:**
- Create: `src/components/home/site-footer.tsx`

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { NewsletterSignup } from "@/components/design";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";

interface FooterLink { href: string; key: string; }

const COLUMNS: Array<{ key: "platform" | "resources" | "company" | "legal"; links: FooterLink[] }> = [
  { key: "platform",  links: [
    { key: "directory",     href: "/companies" },
    { key: "products",      href: "/products" },
    { key: "opportunities", href: "/opportunities" },
    { key: "marketplace",   href: "/market" },
  ]},
  { key: "resources", links: [
    { key: "dataHub", href: "/data-hub" },
    { key: "trust",   href: "/trust" },
    { key: "news",    href: "/news" },
    { key: "blog",    href: "/blog" },
  ]},
  { key: "company",   links: [
    { key: "about",   href: "/about" },
    { key: "contact", href: "/contact" },
    { key: "faq",     href: "/faq" },
    { key: "help",    href: "/contact" },
  ]},
  { key: "legal",     links: [
    { key: "privacy", href: "/privacy" },
    { key: "terms",   href: "/terms" },
    { key: "cookies", href: "/cookies" },
  ]},
];

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.footer" });
  const year = new Date().getFullYear();
  return (
    <footer className="border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[auto_1fr_320px] gap-8">
        <div>
          <p className="text-sm font-semibold">TradeInDRC</p>
          <p className="text-xs text-muted-foreground mt-1">{t("tagline")}</p>
          <div className="flex gap-2 mt-3 text-muted-foreground">
            <a aria-label="Facebook" href="#" className="hover:text-foreground"><Facebook className="w-4 h-4" /></a>
            <a aria-label="Twitter"  href="#" className="hover:text-foreground"><Twitter  className="w-4 h-4" /></a>
            <a aria-label="LinkedIn" href="#" className="hover:text-foreground"><Linkedin className="w-4 h-4" /></a>
            <a aria-label="YouTube"  href="#" className="hover:text-foreground"><Youtube  className="w-4 h-4" /></a>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          {COLUMNS.map((col) => (
            <div key={col.key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t(`columns.${col.key}.title`)}</p>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    <Link href={l.href} className="text-xs hover:underline">{t(`columns.${col.key}.${l.key}`)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <NewsletterSignup />
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>{t("copyright", { year: String(year) })}</span>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:underline">{t("columns.legal.privacy")}</Link>
            <Link href="/terms"   className="hover:underline">{t("columns.legal.terms")}</Link>
            <Link href="/cookies" className="hover:underline">{t("columns.legal.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Task 12: Compose `src/app/[locale]/page.tsx`

**Files:**
- Modify: `src/app/[locale]/page.tsx`

Full rewrite. Remove all old imports. Replace with:

```tsx
import { AlertRibbon } from "@/components/home/alert-ribbon";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedOpportunitiesSection } from "@/components/home/featured-opportunities-section";
import { ExplorerSection } from "@/components/home/explorer-section";
import { LatestBlock } from "@/components/home/latest-block";
import { RfqCtaSection } from "@/components/home/rfq-cta-section";
import { BrandCarouselSection } from "@/components/home/brand-carousel-section";
import { FaqSection } from "@/components/home/faq-section";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <AlertRibbon />
      <HeroSection locale={locale} />
      <FeaturedOpportunitiesSection locale={locale} />
      <ExplorerSection />
      <LatestBlock locale={locale} />
      <RfqCtaSection locale={locale} />
      <BrandCarouselSection locale={locale} />
      <FaqSection locale={locale} />
    </>
  );
}
```

The `<SiteFooter />` is mounted at the **layout level** in Task 13, not on the page itself — so it appears on every page, not just the home.

---

## Task 13: Wire `SiteFooter` in `[locale]/layout.tsx`

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1:** Read the file. Locate the existing `<Footer />` mount (if any).

- [ ] **Step 2:** Replace it with `<SiteFooter locale={locale} />`. Import:

```tsx
import { SiteFooter } from "@/components/home/site-footer";
```

If the old footer import remains used by no other route (per Task 1 recon), remove the import.

If the locale isn't already destructured at the layout level, add `const { locale } = await params;` near the top — it almost certainly already is.

---

## Task 14: Delete obsolete home subcomponents

**Files:**
- Delete (per Task 1 recon): the section components that are now unreachable.

Use `git rm` to delete them; the orchestrator's final commit catches the deletions.

Do not delete a component that's still imported anywhere. Recon output drives this list.

---

## Task 15: Verify + ship-wreck + commit

- [ ] **Step 1:** `npx vitest run` — 24 tests pass (prior 22 + 2 from ExplorerSection test).
- [ ] **Step 2:** `npm run build` — clean.
- [ ] **Step 3:** `npx eslint --quiet src/components/home/ src/app/[locale]/page.tsx src/app/[locale]/layout.tsx src/config/messages/en.json src/config/messages/fr.json` — no errors.
- [ ] **Step 4:** Visual smoke (orchestrator runs `npm run dev` briefly, hits `/en` and `/fr`, confirms no console error, hero renders, featured strip shows up or empty state shows up, footer present).
- [ ] **Step 5:** Orchestrator runs ship-wreck-check.
- [ ] **Step 6:** Orchestrator commits with the phase-2 message.

---

## Self-Review

- **Spec coverage:** DESIGN.md §3.1 has 9 sections — alert ribbon (T3), hero (T4), featured strip (T5), explorer (T6), latest block (T7), RFQ CTA (T8), brand carousel (T9), FAQ (T10), footer (T11+T13). Old sections removed (T14). i18n covers all of them (T2).
- **No placeholders:** every step ships executable code or runs a verifying command. The single TBD-style item is "ExplorerSection v1 routes user out to the section page rather than prefetching grid data" — explicitly called out as v1 and visible to reviewers.
- **Type consistency:** primitives consumed match Phase 1 signatures: `<HeroSearch>` (no props), `<HeroMockupCard locale>`, `<FeaturedOpportunityStrip items locale>`, `<RfqCtaBanner title action>`, `<BrandLogoCarousel logos>`, `<NewsletterSignup>`, `<EmptyState title body>`.

## Done definition

- New `/[locale]` renders the 8 sections + footer in both EN and FR.
- No old `Hero`/`Stats`/`Features`/etc. components remain unused.
- 24+ tests pass; build/lint clean.
- Single commit on `main`.
