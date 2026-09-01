# Design Phase 1 — Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) syntax.

**Goal:** Ship the design-system primitives layer that every redesigned page in Phases 2–8 will consume. No public-facing page changes in this phase.

**Architecture:** New folder `src/components/design/` (deliberately separate from `src/components/ui/` shadcn primitives). Each primitive is a small, focused file. Server components by default. Bilingual strings under a new `Design.*` next-intl namespace. Tokens reused from `globals.css` — no new colors.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, next-intl, lucide-react, framer-motion (only where motion is needed). All deps already installed.

**Reference spec:** `DESIGN.md` §2 (primitives), §4 (tokens), §5 (layout grid), §8 (a11y/i18n).

**No commits per task** — orchestrator runs verify + ship-wreck + single commit on `main` at the end.

---

## File Structure

**Create:**
- `src/components/design/page-header.tsx`
- `src/components/design/list-page-shell.tsx`
- `src/components/design/filter-sidebar.tsx` — exports `FilterSidebar`, `FilterGroup`, `FilterItem`
- `src/components/design/filter-chip.tsx`
- `src/components/design/tag-chip.tsx`
- `src/components/design/stat.tsx`
- `src/components/design/empty-state.tsx`
- `src/components/design/rfq-cta-banner.tsx`
- `src/components/design/featured-opportunity-strip.tsx`
- `src/components/design/opportunity-card-design.tsx` — DS-styled variant (the existing one in `src/components/opportunities/opportunity-card.tsx` stays untouched)
- `src/components/design/company-row.tsx`
- `src/components/design/product-card-design.tsx` — DS-styled variant
- `src/components/design/brand-logo-carousel.tsx`
- `src/components/design/newsletter-signup.tsx`
- `src/components/design/hero-search.tsx`
- `src/components/design/hero-mockup-card.tsx`
- `src/components/design/index.ts` — barrel re-export
- `src/components/design/CLAUDE.md` — folder rules
- `src/components/design/__tests__/filter-sidebar.test.tsx` — RTL tests for the only client primitive with interaction logic that's not a thin wrapper

**Modify:**
- `src/config/messages/en.json` and `fr.json` — add `Design.*` namespace.
- `src/components/ui/CLAUDE.md` — append a one-line note: "For composed page primitives see `src/components/design/`."

---

## Conventions every primitive obeys

(Re-state here so each task can refer to a single source.)

1. Server Component unless the primitive uses hooks or browser APIs. Client primitives in Phase 1: `<HeroSearch>`, `<NewsletterSignup>`, `<BrandLogoCarousel>`, `<FilterSidebar>` (collapsible groups), `<EmptyState action>` if action is a button (we'll skip — accept ReactNode).
2. Padding scale `2/3/4` (8/12/16 px); larger only on `<PageHeader>` outer wrapper at `py-6`.
3. Radius: `rounded-md`. Chips: `rounded-full`. No `rounded-xl`/`rounded-2xl`.
4. Borders: `border` token. No `border-2`. No `shadow-*`.
5. Type: `text-xs`/`text-sm`/`text-base`/`text-lg`/`text-xl`/`text-2xl`. Hero only may use `text-3xl`.
6. Color: `bg-white`/`bg-card`/`bg-muted`. Primary color only on CTAs, links, active tabs, section banners. NEVER `bg-primary/10` for soft surfaces.
7. All user-visible strings come from `next-intl` (`useTranslations` client / `getTranslations` server). Internal labels passed via props.
8. Default exports: avoid. Use named exports.

---

## Task 1: Design namespace in messages files

**Files:**
- Modify: `src/config/messages/en.json`
- Modify: `src/config/messages/fr.json`

- [ ] **Step 1: Read both files** to find the merge point (top-level keys list).

- [ ] **Step 2: Add to en.json under a new top-level `Design` key**

```json
"Design": {
  "search": "Search",
  "viewAll": "View all",
  "sendRfq": "Send RFQ",
  "addRfq": "Add free RFQ",
  "noResults": "No results.",
  "resetFilters": "Reset filters",
  "remove": "Remove",
  "subscribe": "Subscribe",
  "emailPlaceholder": "you@example.com",
  "newsletter": {
    "headline": "Stay updated",
    "body": "Get monthly trade insights from DRC, delivered to your inbox.",
    "consent": "I agree to receive emails from TradeInDRC and have read the {privacyLink}.",
    "privacy": "Privacy Policy"
  },
  "hero": {
    "tabs": {
      "importers": "Importers",
      "exporters": "Exporters",
      "products": "Products",
      "opportunities": "Opportunities"
    },
    "placeholder": "Search verified Congolese exporters, products, opportunities…"
  },
  "rfqBanner": {
    "title": "Send an RFQ to every verified company on this page",
    "action": "Submit RFQ"
  },
  "previous": "Previous",
  "next": "Next"
}
```

- [ ] **Step 3: Add to fr.json under `Design`**

```json
"Design": {
  "search": "Rechercher",
  "viewAll": "Voir tout",
  "sendRfq": "Envoyer un RFQ",
  "addRfq": "Ajouter un RFQ gratuit",
  "noResults": "Aucun résultat.",
  "resetFilters": "Réinitialiser les filtres",
  "remove": "Retirer",
  "subscribe": "S'abonner",
  "emailPlaceholder": "vous@exemple.com",
  "newsletter": {
    "headline": "Restez informé",
    "body": "Recevez chaque mois des informations sur le commerce en RDC dans votre boîte mail.",
    "consent": "J'accepte de recevoir des e-mails de TradeInDRC et j'ai lu la {privacyLink}.",
    "privacy": "Politique de confidentialité"
  },
  "hero": {
    "tabs": {
      "importers": "Importateurs",
      "exporters": "Exportateurs",
      "products": "Produits",
      "opportunities": "Opportunités"
    },
    "placeholder": "Cherchez des exportateurs congolais vérifiés, produits, opportunités…"
  },
  "rfqBanner": {
    "title": "Envoyez un RFQ à toutes les entreprises vérifiées de cette page",
    "action": "Soumettre RFQ"
  },
  "previous": "Précédent",
  "next": "Suivant"
}
```

- [ ] **Step 4: Verify** both parse:

```bash
node -e "JSON.parse(require('fs').readFileSync('src/config/messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('src/config/messages/fr.json','utf8'))"
```

---

## Task 2: `<PageHeader>`

**Files:**
- Create: `src/components/design/page-header.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-6 border-b">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

`npm run build` — clean.

---

## Task 3: `<TagChip>` and `<Stat>`

**Files:**
- Create: `src/components/design/tag-chip.tsx`
- Create: `src/components/design/stat.tsx`

- [ ] **Step 1: tag-chip.tsx**

```tsx
import { cn } from "@/lib/utils";

export function TagChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700", className)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2: stat.tsx**

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({ icon, label, value, className }: { icon?: ReactNode; label?: string; value: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {icon && <span aria-hidden>{icon}</span>}
      <span>{value}{label ? <span className="ml-1">{label}</span> : null}</span>
    </span>
  );
}
```

---

## Task 4: `<FilterChip>`

**Files:**
- Create: `src/components/design/filter-chip.tsx`

```tsx
"use client";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  const t = useTranslations("Design");
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border bg-card">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button type="button" aria-label={t("remove")} onClick={onRemove} className="hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
```

---

## Task 5: `<FilterSidebar>` family + RTL test

**Files:**
- Create: `src/components/design/filter-sidebar.tsx`
- Create: `src/components/design/__tests__/filter-sidebar.test.tsx`

- [ ] **Step 1: filter-sidebar.tsx**

```tsx
"use client";
import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterSidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="space-y-4 text-sm">
      {children}
    </aside>
  );
}

interface FilterGroupProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FilterGroup({ label, defaultOpen = true, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown className={cn("w-3 h-3 transition", open ? "rotate-180" : "")} aria-hidden />
      </button>
      {open && <div className="space-y-1 pt-1">{children}</div>}
    </section>
  );
}

interface FilterItemProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function FilterItem({ label, count, active, onClick, href }: FilterItemProps) {
  const className = cn(
    "flex items-center justify-between px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-muted",
    active && "bg-muted font-medium"
  );
  const inner = (
    <>
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
    </>
  );
  if (href) return <a href={href} className={className}>{inner}</a>;
  return (
    <button type="button" onClick={onClick} className={className + " w-full text-left"}>
      {inner}
    </button>
  );
}
```

- [ ] **Step 2: filter-sidebar.test.tsx**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterSidebar, FilterGroup, FilterItem } from "../filter-sidebar";

describe("FilterSidebar", () => {
  it("renders group label and items", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" count={12} />
          <FilterItem label="Agriculture" count={7} />
        </FilterGroup>
      </FilterSidebar>
    );
    expect(screen.getByText("Sectors")).toBeInTheDocument();
    expect(screen.getByText("Mining")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("collapses and expands group on header click", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" />
        </FilterGroup>
      </FilterSidebar>
    );
    const button = screen.getByRole("button", { name: /sectors/i });
    expect(screen.getByText("Mining")).toBeVisible();
    fireEvent.click(button);
    expect(screen.queryByText("Mining")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText("Mining")).toBeVisible();
  });

  it("marks active item with bold class", () => {
    render(
      <FilterSidebar>
        <FilterGroup label="Sectors">
          <FilterItem label="Mining" active />
          <FilterItem label="Agriculture" />
        </FilterGroup>
      </FilterSidebar>
    );
    expect(screen.getByText("Mining").parentElement).toHaveClass("font-medium");
  });
});
```

- [ ] **Step 3: Setup file for RTL DOM matchers**

If vitest setup doesn't already extend matchers for `toBeInTheDocument`, add a setup file. Check `vitest.config.ts` — if `setupFiles` is empty:

Edit `vitest.config.ts` `setupFiles: ["./vitest.setup.ts"]` and create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Run tests**

`npx vitest run src/components/design/__tests__/filter-sidebar.test.tsx`
Expected: 3 PASS.

---

## Task 6: `<EmptyState>`

**Files:**
- Create: `src/components/design/empty-state.tsx`

```tsx
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border rounded-md bg-muted/30">
      {icon && <div className="inline-flex items-center justify-center mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

---

## Task 7: `<ListPageShell>`

**Files:**
- Create: `src/components/design/list-page-shell.tsx`

```tsx
import { ReactNode } from "react";

interface ListPageShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ListPageShell({ sidebar, children }: ListPageShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="hidden md:block">{sidebar}</aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
```

---

## Task 8: `<RfqCtaBanner>`

**Files:**
- Create: `src/components/design/rfq-cta-banner.tsx`

```tsx
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface RfqCtaBannerProps {
  title: string;
  action: ReactNode;     // typically a <Link> or <Button>
}

export function RfqCtaBanner({ title, action }: RfqCtaBannerProps) {
  return (
    <div className="bg-primary text-primary-foreground rounded-md px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm font-medium flex items-center gap-2">
        <ArrowRight className="w-4 h-4" aria-hidden />
        {title}
      </p>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
```

---

## Task 9: `<OpportunityCard>` (design variant) + `<FeaturedOpportunityStrip>`

**Files:**
- Create: `src/components/design/opportunity-card-design.tsx`
- Create: `src/components/design/featured-opportunity-strip.tsx`

- [ ] **Step 1: opportunity-card-design.tsx**

The existing `src/components/opportunities/opportunity-card.tsx` (S5) renders the body card. This new variant matches the TurkishExporter "featured opportunity tile" — country flag, category pill, stats row, title, summary.

```tsx
import { Link } from "@/i18n/routing";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { TagChip } from "./tag-chip";
import { Stat } from "./stat";
import { Eye, Clock } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface Props {
  item: Opportunity;
  locale: string;
  views?: number;
}

export function OpportunityCardDesign({ item, locale, views }: Props) {
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const deadline = item.deadline_at ? new Date(item.deadline_at).toLocaleDateString(locale) : null;
  return (
    <Link
      href={`/opportunities/${item.category}/${item.slug}`}
      className="block border rounded-md p-3 bg-card hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <CategoryBadge category={item.category} />
        <div className="flex items-center gap-3">
          {views !== undefined && <Stat icon={<Eye className="w-3 h-3" />} value={views} />}
          {deadline && <Stat icon={<Clock className="w-3 h-3" />} value={deadline} />}
        </div>
      </div>
      <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
      {item.region && (
        <div className="mt-2"><TagChip>{item.region}</TagChip></div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: featured-opportunity-strip.tsx**

```tsx
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { OpportunityCardDesign } from "./opportunity-card-design";
import type { Opportunity } from "@/lib/opportunities/types";

export async function FeaturedOpportunityStrip({
  items,
  locale,
}: {
  items: Opportunity[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Design" });
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {items.slice(0, 5).map((o) => (
        <OpportunityCardDesign key={o.id} item={o} locale={locale} />
      ))}
      <Link
        href="/dashboard/opportunities/new"
        className="border border-dashed rounded-md p-3 flex flex-col items-center justify-center text-sm bg-card hover:bg-muted/40 text-primary"
      >
        <Plus className="w-5 h-5 mb-1" />
        {t("addRfq")}
      </Link>
    </div>
  );
}
```

---

## Task 10: `<CompanyRow>`

**Files:**
- Create: `src/components/design/company-row.tsx`

```tsx
import { Link } from "@/i18n/routing";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { TagChip } from "./tag-chip";
import type { VerificationTier } from "@/lib/trust/types";

interface CompanyRowData {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  verification_tier?: VerificationTier | null;
  founded_year?: number | null;
  tags?: string[];
  thumbnail_urls?: string[];
}

interface CompanyRowProps {
  company: CompanyRowData;
}

export function CompanyRow({ company }: CompanyRowProps) {
  const tier = (company.verification_tier ?? "none") as VerificationTier;
  return (
    <Link
      href={`/companies/${company.id}`}
      className="grid grid-cols-[56px_1fr_auto] gap-4 items-start border rounded-md p-3 bg-card hover:bg-muted/40"
    >
      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {company.logo_url
          ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm font-semibold text-muted-foreground">{company.name.slice(0, 2)}</span>
        }
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{company.name}</span>
          <VerificationBadge tier={tier} />
          {company.founded_year && (
            <span className="text-xs text-muted-foreground">{new Date().getFullYear() - company.founded_year} y</span>
          )}
        </div>
        {company.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{company.description}</p>
        )}
        {company.tags && company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {company.tags.slice(0, 6).map((t) => <TagChip key={t}>{t}</TagChip>)}
          </div>
        )}
      </div>
      {company.thumbnail_urls && company.thumbnail_urls.length > 0 && (
        <div className="hidden md:flex gap-1 shrink-0">
          {company.thumbnail_urls.slice(0, 5).map((src, i) => (
            <span key={i} className="w-12 h-12 rounded bg-muted overflow-hidden inline-block">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
```

(Yes, plain `<img>` — the codebase already uses `<img>` per S2/S4 (lint warning only). We accept it; if Next/Image-ifying every product image becomes a project, that's a separate slice.)

---

## Task 11: `<ProductCardDesign>`

**Files:**
- Create: `src/components/design/product-card-design.tsx`

```tsx
import { Link } from "@/i18n/routing";

interface ProductCardData {
  id: string;
  name: string;
  image_url?: string | null;
  company_id: string;
  company_name?: string | null;
}

export function ProductCardDesign({ item }: { item: ProductCardData }) {
  return (
    <Link
      href={`/products/${item.id}`}
      className="block border rounded-md bg-card hover:bg-muted/40 overflow-hidden"
    >
      <div className="aspect-square bg-muted overflow-hidden">
        {item.image_url
          ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          : <span className="block w-full h-full" />
        }
      </div>
      <div className="p-2">
        <p className="text-xs font-medium leading-tight line-clamp-2">{item.name}</p>
        {item.company_name && (
          <p className="text-[11px] text-primary mt-1 line-clamp-1">{item.company_name}</p>
        )}
      </div>
    </Link>
  );
}
```

---

## Task 12: `<BrandLogoCarousel>`

**Files:**
- Create: `src/components/design/brand-logo-carousel.tsx`

```tsx
"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface BrandLogo {
  id: string;
  name: string;
  logo_url?: string | null;
}

export function BrandLogoCarousel({ logos }: { logos: BrandLogo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("Design");
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  if (!logos.length) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("previous")}
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border bg-card"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div ref={ref} className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-8 no-scrollbar">
        {logos.map((l) => (
          <div key={l.id} className="snap-start shrink-0 w-32 h-16 flex items-center justify-center grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition">
            {l.logo_url
              ? <img src={l.logo_url} alt={l.name} className="max-h-12 max-w-full object-contain" />
              : <span className="text-xs font-medium text-muted-foreground">{l.name}</span>
            }
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("next")}
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full border bg-card"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
```

Note: `no-scrollbar` Tailwind utility may need a CSS rule. If `globals.css` doesn't define it, add:

```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

at the bottom of `src/app/globals.css`.

---

## Task 13: `<NewsletterSignup>`

**Files:**
- Create: `src/components/design/newsletter-signup.tsx`

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterSignup() {
  const t = useTranslations("Design.newsletter");
  const td = useTranslations("Design");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setBusy(true);
    // Endpoint TBD in a future slice; for now just simulate.
    setTimeout(() => {
      setBusy(false);
      setEmail("");
      setConsent(false);
      toast.success(td("subscribe"));
    }, 400);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-medium">{t("headline")}</p>
      <p className="text-xs text-muted-foreground">{t("body")}</p>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={td("emailPlaceholder")}
          className="h-9 text-sm"
        />
        <Button type="submit" disabled={!consent || busy} size="sm" className="h-9">{td("subscribe")}</Button>
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>
          {t("consent", { privacyLink: t("privacy") })}
        </span>
      </label>
    </form>
  );
}
```

Note: `consent` rendering of `{privacyLink}` as plain text is fine for v1; we can wire a real link via `next-intl`'s rich text later.

---

## Task 14: `<HeroSearch>` (client)

**Files:**
- Create: `src/components/design/hero-search.tsx`

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeroTab = "importers" | "exporters" | "products" | "opportunities";

const HREF_BY_TAB: Record<HeroTab, (q: string) => string> = {
  importers: (q) => `/opportunities?q=${encodeURIComponent(q)}`,
  exporters: (q) => `/companies?q=${encodeURIComponent(q)}`,
  products: (q) => `/products?q=${encodeURIComponent(q)}`,
  opportunities: (q) => `/opportunities?q=${encodeURIComponent(q)}`,
};

export function HeroSearch() {
  const t = useTranslations("Design.hero");
  const td = useTranslations("Design");
  const router = useRouter();
  const [tab, setTab] = useState<HeroTab>("exporters");
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(HREF_BY_TAB[tab](q.trim()));
  }

  const tabs: HeroTab[] = ["importers", "exporters", "products", "opportunities"];

  return (
    <div className="w-full max-w-2xl">
      <div className="flex gap-1 mb-1">
        {tabs.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 text-xs rounded-t-md ${tab === k ? "bg-white text-foreground" : "bg-white/20 text-white"}`}
            aria-pressed={tab === k}
          >
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2 bg-white rounded-md rounded-tl-none p-2">
        <div className="flex-1 flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("placeholder")}
            className="h-9 border-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>
        <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 h-9">{td("search")}</Button>
      </form>
    </div>
  );
}
```

---

## Task 15: `<HeroMockupCard>` (server)

**Files:**
- Create: `src/components/design/hero-mockup-card.tsx`

A flat illustrated card — no real device frame. Shows a stylized "Opportunity feed" preview made of plain divs (no PNG/SVG asset needed for v1; if a future slice provides an SVG we swap it in).

```tsx
import { CheckCircle2, Globe } from "lucide-react";

export function HeroMockupCard() {
  return (
    <div className="hidden md:block w-full max-w-sm bg-card text-foreground rounded-md p-3 shadow-none border">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-primary" />
        <p className="text-xs font-medium">Live opportunity feed</p>
      </div>
      {[
        { country: "🇫🇷 France", title: "Burger Box request", chip: "Importer" },
        { country: "🇨🇩 DRC",    title: "Copper offer 50T",  chip: "Exporter" },
        { country: "🇪🇹 Ethiopia", title: "Drain cleaning", chip: "Importer" },
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between border-t py-2 text-xs">
          <div className="min-w-0">
            <p className="truncate font-medium">{row.title}</p>
            <p className="text-muted-foreground">{row.country}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            {row.chip}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## Task 16: Barrel + CLAUDE.md

**Files:**
- Create: `src/components/design/index.ts`
- Create: `src/components/design/CLAUDE.md`
- Modify: `src/components/ui/CLAUDE.md` — add one-line pointer

- [ ] **Step 1: index.ts**

```ts
export { PageHeader } from "./page-header";
export { ListPageShell } from "./list-page-shell";
export { FilterSidebar, FilterGroup, FilterItem } from "./filter-sidebar";
export { FilterChip } from "./filter-chip";
export { TagChip } from "./tag-chip";
export { Stat } from "./stat";
export { EmptyState } from "./empty-state";
export { RfqCtaBanner } from "./rfq-cta-banner";
export { OpportunityCardDesign } from "./opportunity-card-design";
export { FeaturedOpportunityStrip } from "./featured-opportunity-strip";
export { CompanyRow } from "./company-row";
export { ProductCardDesign } from "./product-card-design";
export { BrandLogoCarousel } from "./brand-logo-carousel";
export { NewsletterSignup } from "./newsletter-signup";
export { HeroSearch } from "./hero-search";
export { HeroMockupCard } from "./hero-mockup-card";
```

- [ ] **Step 2: CLAUDE.md**

```markdown
# Design-system primitives

This folder holds the composed primitives used by the page rewrites driven by `DESIGN.md`. They sit on top of `src/components/ui/` (shadcn). Do not put shadcn primitives here.

Rules every primitive obeys:
- White background. `--primary` only on CTAs, links, active tabs, banners.
- Padding scale 2/3/4 (8/12/16px). Outer page wrapper may use `py-6`.
- Radius `rounded-md`. Chips/pills `rounded-full`. No `rounded-xl`/`rounded-2xl`.
- No `shadow-*`. Borders 1 px `border` token only.
- All user-visible strings via next-intl (`Design.*` namespace).
- Server Components by default; mark `"use client"` only when needed.
- Named exports only. Re-export via `index.ts`.

When a page needs a new primitive, add it here, document it in `DESIGN.md` §2, then use it. Don't inline new patterns in pages.
```

- [ ] **Step 3: Append to `src/components/ui/CLAUDE.md`**

Add a final bullet:
> - For composed page primitives (PageHeader, ListPageShell, …) see `src/components/design/`.

---

## Task 17: Verify + ship-wreck + commit

- [ ] **Step 1:** `npx vitest run` → 19+3=22 tests pass (or whatever current + 3 new).
- [ ] **Step 2:** `npm run build` → clean.
- [ ] **Step 3:** `npx eslint --quiet src/components/design/ src/config/messages/en.json src/config/messages/fr.json` → no errors.
- [ ] **Step 4:** Orchestrator runs ship-wreck-check.
- [ ] **Step 5:** Orchestrator commits with the canonical phase-1 message.

---

## Self-Review

- **Spec coverage:** Every primitive listed in DESIGN.md §2 has a task here (T2–T15). i18n namespace from §8 is in T1. Index/CLAUDE in T16. Tokens consumed (no new colors added) — confirmed by reading globals.css earlier.
- **No placeholders:** every step has code or a clear acceptance command. The one TBD-adjacent reference is the newsletter "endpoint TBD" — but it's a v1 simulation, explicitly called out; the form is real, the API hook is the future.
- **Type consistency:** `OpportunityCardDesign` reuses `Opportunity` from `@/lib/opportunities/types` (S5). `CompanyRow` reuses `VerificationTier` from `@/lib/trust/types` (S2). `BrandLogo` is a small local interface — that's fine for v1; if the project later adds a `Brand` table, swap to that type then.
- **Bite-sized:** every task ships one or two files. None exceeds ~80 lines of code per file.

## Done definition

- 22+ tests pass; build/lint clean.
- All 16 primitives exist in `src/components/design/`, exported via `index.ts`.
- `Design.*` i18n namespace populated in `en.json` and `fr.json`.
- Folder CLAUDE.md present and ui/CLAUDE.md updated.
- No public pages changed (Phase 2+ does that).
- Single commit on `main` from the orchestrator.
