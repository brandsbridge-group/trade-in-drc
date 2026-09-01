# Design Phase 4 — Public Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Reskin every public detail page to use the Phase 1 design system. Same content/data, new typography + chip styles + tighter paddings + RFQ CTA cards on the right.

**Pages in scope:**
1. `/companies/[id]` — Company detail
2. `/products/[id]` — Product detail
3. `/opportunities/[category]/[slug]` — Opportunity detail
4. `/trust` — Trust Center landing
5. `/trust/[companySlug]` — Per-company trust report
6. `/data-hub` — Data Hub landing
7. `/data-hub/reports/[kind]/[slug]` — Report detail
8. `/data-hub/prices/[seriesId]` — Price series detail

**No commits per task. No `git add`.** Orchestrator commits once at the end.

---

## File Structure

**Create:**
- `src/components/detail/page-meta.tsx` — small inline meta row (e.g. "Country · Founded · Website").
- `src/components/detail/sidecar.tsx` — right-side action card (`<aside>` 280 px) containing contact + RFQ buttons.

**Modify (8 pages):**
- `src/app/[locale]/companies/[id]/page.tsx`
- `src/app/[locale]/products/[id]/page.tsx`
- `src/app/[locale]/opportunities/[category]/[slug]/page.tsx`
- `src/app/[locale]/trust/page.tsx`
- `src/app/[locale]/trust/[companySlug]/page.tsx`
- `src/app/[locale]/data-hub/page.tsx`
- `src/app/[locale]/data-hub/reports/[kind]/[slug]/page.tsx`
- `src/app/[locale]/data-hub/prices/[seriesId]/page.tsx`

**Modify:**
- `src/config/messages/{en,fr}.json` — small additions to existing namespaces for "Send RFQ", "Message company", etc., if not already present.

---

## Convention for every detail page

```
+--------------------------------------------------+
| PageHeader (title + subtitle/meta row)           |
+----------------------------+---------------------+
| Main column                | Sidecar (280px)     |
|  - hero / image / meta     |  - Send RFQ button  |
|  - body markdown           |  - Contact button   |
|  - tabs / sections         |  - "View list" link |
|                            |  - small meta block |
+----------------------------+---------------------+
```

Wrap with `max-w-6xl mx-auto px-4 py-6`. At < md, sidecar drops below main.

Page-by-page tweaks below.

---

## Task 1: `<PageMeta>` + `<Sidecar>` primitives

**Files:**
- Create: `src/components/detail/page-meta.tsx`
- Create: `src/components/detail/sidecar.tsx`

### `page-meta.tsx`

```tsx
import { ReactNode } from "react";

interface MetaItem { label?: string; value: ReactNode; }

export function PageMeta({ items }: { items: MetaItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i}>
          {it.label && <span className="mr-1">{it.label}:</span>}
          <span className="text-foreground">{it.value}</span>
        </span>
      ))}
    </div>
  );
}
```

### `sidecar.tsx`

```tsx
import { ReactNode } from "react";

export function Sidecar({ children }: { children: ReactNode }) {
  return (
    <aside className="md:sticky md:top-4 border rounded-md p-4 bg-card text-sm space-y-3 h-fit">
      {children}
    </aside>
  );
}
```

---

## Task 2: Company detail `/companies/[id]/page.tsx`

Read the current file first. It already shows verification badge + tabs (S2/S4). Apply the new shell:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import { CompanyTabs } from "@/components/marketplace/company-tabs";
import type { VerificationTier } from "@/lib/trust/types";

interface Company {
  id: string; name: string; description: string | null;
  city: string | null; province: string | null; website: string | null;
  verification_tier: string | null; status: string;
  sector_id: string | null;
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, description, city, province, website, verification_tier, status, sector_id")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const company = data as unknown as Company;
  const tier = (company.verification_tier ?? "none") as VerificationTier;
  const t = await getTranslations({ locale, namespace: "Trust.report" });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        title={company.name}
        subtitle={company.description ?? undefined}
        action={<VerificationBadge tier={tier} />}
      />
      <div className="mt-3">
        <PageMeta items={[
          ...(company.city || company.province ? [{ value: [company.city, company.province].filter(Boolean).join(", ") }] : []),
          ...(company.website ? [{ value: <a href={company.website} className="underline" target="_blank" rel="noopener noreferrer">{company.website}</a> }] : []),
        ]} />
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          <CompanyTabs companyId={company.id} locale={locale} />
        </div>
        <Sidecar>
          <Link
            href={`/dashboard/opportunities/new?company=${company.id}`}
            className="block text-center bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium"
          >
            Send RFQ
          </Link>
          <Link
            href={`/trust/${company.id}`}
            className="block text-center border rounded-md py-2 text-sm hover:bg-muted/40"
          >
            {t("title", { company: "" }).replace(":", "").trim() || "View trust report"}
          </Link>
        </Sidecar>
      </div>
    </div>
  );
}
```

If CompanyTabs takes different props, adjust to its current signature (S4). Read it first.

---

## Task 3: Product detail `/products/[id]/page.tsx`

Read current. Probably hand-built. Apply shell:

```tsx
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import type { VerificationTier } from "@/lib/trust/types";

interface Product {
  id: string; name: string; description: string | null; specs: Record<string, unknown> | null;
  images: string[] | null; category_id: string | null;
  companies: { id: string; name: string; verification_tier: string | null; status: string } | null;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, description, specs, images, category_id, companies(id, name, verification_tier, status)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const product = data as unknown as Product;
  const tier = (product.companies?.verification_tier ?? "none") as VerificationTier;
  const cover = product.images?.[0] ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader title={product.name} subtitle={product.description ?? undefined} />
      <div className="grid md:grid-cols-[1fr_320px] gap-6 mt-6">
        <div className="min-w-0">
          <div className="aspect-square bg-muted rounded-md overflow-hidden mb-4">
            {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="border rounded-md p-3">
              <p className="text-sm font-medium mb-2">Specifications</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground inline">{k}: </dt>
                    <dd className="inline">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <Sidecar>
          {product.companies && (
            <>
              <p className="text-xs text-muted-foreground">Sold by</p>
              <div className="flex items-center justify-between gap-2">
                <Link href={`/companies/${product.companies.id}`} className="text-sm font-medium hover:underline">{product.companies.name}</Link>
                <VerificationBadge tier={tier} />
              </div>
              <Link href={`/dashboard/opportunities/new?company=${product.companies.id}`} className="block text-center bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium">
                Send RFQ
              </Link>
            </>
          )}
        </Sidecar>
      </div>
    </div>
  );
}
```

---

## Task 4: Opportunity detail `/opportunities/[category]/[slug]/page.tsx`

S5 already shipped a workable detail page. Apply new shell + sidecar:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBySlug } from "@/lib/opportunities/queries";
import { isOpportunityCategory } from "@/lib/opportunities/categories";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { MarkdownView } from "@/components/content/markdown-view";
import { ContactButton } from "@/components/opportunities/contact-button";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";

export default async function OpportunityDetail({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  if (!isOpportunityCategory(category)) notFound();
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();
  const op = await getBySlug(supabase, category, slug);
  if (!op) notFound();
  const title = locale === "fr" ? op.title_fr : op.title_en;
  const summary = locale === "fr" ? op.summary_fr : op.summary_en;
  const body = locale === "fr" ? op.body_fr : op.body_en;
  const deadline = op.deadline_at ? new Date(op.deadline_at).toLocaleDateString(locale) : null;
  const budget = (op.budget_min || op.budget_max)
    ? `${op.budget_min ?? ""}${op.budget_min && op.budget_max ? " – " : ""}${op.budget_max ?? ""} ${op.budget_currency ?? ""}`.trim()
    : null;
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader title={title} subtitle={summary} action={<CategoryBadge category={op.category} />} />
      <div className="mt-3">
        <PageMeta items={[
          ...(deadline ? [{ label: t("fields.deadline"), value: deadline }] : []),
          ...(budget ? [{ label: t("fields.budget"), value: budget }] : []),
          ...(op.region ? [{ label: t("fields.region"), value: op.region }] : []),
        ]} />
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          {body && <MarkdownView source={body} />}
        </div>
        <Sidecar>
          <ContactButton companyId={op.company_id} subject={title} />
        </Sidecar>
      </div>
    </div>
  );
}
```

---

## Task 5: Trust pages

### `/trust/page.tsx`

Already in good shape (S2). Keep its pillar grid but slot inside design tokens:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { VerificationBadge } from "@/components/trust/verification-badge";

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Trust.page" });
  const pillars = [
    { titleKey: "kybTitle", bodyKey: "kybBody" },
    { titleKey: "kypTitle", bodyKey: "kypBody" },
    { titleKey: "kycTitle", bodyKey: "kycBody" },
  ] as const;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section className="grid gap-3 md:grid-cols-3 my-6">
        {pillars.map((p) => (
          <div key={p.titleKey} className="border rounded-md p-4 bg-card">
            <h2 className="text-sm font-medium mb-1">{t(p.titleKey)}</h2>
            <p className="text-xs text-muted-foreground">{t(p.bodyKey)}</p>
          </div>
        ))}
      </section>
      <h2 className="text-sm font-semibold mt-8 mb-3">{t("tiersTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        {(["none","basic","verified","premium"] as const).map((tier) => (
          <VerificationBadge key={tier} tier={tier} />
        ))}
      </div>
    </div>
  );
}
```

### `/trust/[companySlug]/page.tsx`

Apply shell + sidecar:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { TrustSummaryCard } from "@/components/trust/trust-summary-card";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import { Link } from "@/i18n/routing";
import type { VerificationSummary, VerificationTier } from "@/lib/trust/types";

export default async function CompanyTrustReportPage({
  params,
}: {
  params: Promise<{ locale: string; companySlug: string }>;
}) {
  const { locale, companySlug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, verification_tier, verified_at, verification_summary")
    .eq("id", companySlug)
    .eq("status", "verified")
    .single();
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: "Trust.report" });
  const tier = ((data.verification_tier ?? "none") as VerificationTier);
  const summary = ((data.verification_summary ?? null) as VerificationSummary | null);
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={t("title", { company: data.name })} action={<VerificationBadge tier={tier} />} />
      {data.verified_at && (
        <div className="mt-3">
          <PageMeta items={[{ label: t("lastUpdated", { date: "" }).replace(":", "").trim(),
                              value: new Date(data.verified_at).toLocaleDateString(locale) }]} />
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="border rounded-md p-4 bg-card">
          <TrustSummaryCard summary={summary} locale={locale} />
        </div>
        <Sidecar>
          <Link href={`/companies/${data.id}`} className="block text-center border rounded-md py-2 text-sm hover:bg-muted/40">
            ← {data.name}
          </Link>
        </Sidecar>
      </div>
    </div>
  );
}
```

---

## Task 6: Data Hub landing + report/price detail

### `/data-hub/page.tsx`

Apply `PageHeader` + pillar grid in design tokens. Keep 4 pillars. Already roughly there from S6 — just add PageHeader + tighten paddings.

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { BarChart3, Scale, ScrollText, LineChart } from "lucide-react";

export default async function DataHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const pillars = [
    { key: "market_report", href: "/data-hub/reports/market_report", icon: BarChart3 },
    { key: "legal_guide",   href: "/data-hub/reports/legal_guide",   icon: Scale },
    { key: "regulation",    href: "/data-hub/reports/regulation",    icon: ScrollText },
    { key: "prices",        href: "/data-hub/prices",                icon: LineChart },
  ] as const;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={t("page.title")} subtitle={t("page.subtitle")} />
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.key} href={p.href} className="border rounded-md p-4 bg-card hover:bg-muted/40">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">{t(`pillars.${p.key}.title`)}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t(`pillars.${p.key}.body`)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

### `/data-hub/reports/[kind]/[slug]/page.tsx`

Apply shell + sidecar:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReportKind } from "@/lib/data-hub/kinds";
import { getReportBySlug } from "@/lib/data-hub/queries";
import { MarkdownView } from "@/components/content/markdown-view";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string; slug: string }>;
}) {
  const { locale, kind, slug } = await params;
  if (!isReportKind(kind)) notFound();
  const supabase = await createServerSupabaseClient();
  const item = await getReportBySlug(supabase, kind, slug);
  if (!item) notFound();
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const body = locale === "fr" ? item.body_fr : item.body_en;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={title} subtitle={summary ?? undefined} />
      <div className="mt-3">
        <PageMeta items={[
          ...(item.published_at ? [{ value: new Date(item.published_at).toLocaleDateString(locale) }] : []),
          { value: t(`pillars.${item.kind}.title`) },
        ]} />
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          {body && <MarkdownView source={body} />}
        </div>
        <Sidecar>
          {item.attachment_url && (
            <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="block text-center bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium">
              Download
            </a>
          )}
        </Sidecar>
      </div>
    </div>
  );
}
```

### `/data-hub/prices/[seriesId]/page.tsx`

Same shell, sidecar with "latest price" block.

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSeriesWithPoints } from "@/lib/data-hub/queries";
import { PriceChart } from "@/components/data-hub/price-chart";
import { PageHeader } from "@/components/design";
import { Sidecar } from "@/components/detail/sidecar";

export default async function PriceSeriesDetailPage({
  params,
}: {
  params: Promise<{ locale: string; seriesId: string }>;
}) {
  const { locale, seriesId } = await params;
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const supabase = await createServerSupabaseClient();
  const { series, points } = await getSeriesWithPoints(supabase, seriesId);
  if (!series) notFound();
  const name = locale === "fr" ? series.commodity_fr : series.commodity_en;
  const latest = points.length ? points[points.length - 1] : null;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={name} subtitle={`${series.currency}/${series.unit}`} />
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold mb-2">{t("prices.chartTitle")}</h2>
          <PriceChart data={points} unit={series.unit} currency={series.currency} />
        </div>
        <Sidecar>
          <p className="text-xs text-muted-foreground">{t("prices.pointCount", { count: points.length })}</p>
          {latest && (
            <p className="text-sm font-medium">
              {t("prices.latestPrice", { value: String(latest.value), currency: series.currency, unit: series.unit })}
            </p>
          )}
          {series.source && <p className="text-xs text-muted-foreground">{t("fields.source")}: {series.source}</p>}
        </Sidecar>
      </div>
    </div>
  );
}
```

---

## Task 7: Verify + ship-wreck + commit

- `npx vitest run` — 24 tests pass.
- `npm run build` — clean.
- `npx eslint --quiet src/components/detail/ <all 8 modified page files>` — no errors.
- Orchestrator runs ship-wreck-check.
- Single commit.

---

## Self-Review

- **Spec coverage:** DESIGN.md §3.3 (Company detail) → T2; §3.5 (Product detail) → T3; §3.7 (Opportunity detail) → T4; §3.9 (Trust) → T5; §3.11 (Data Hub detail) → T6.
- **No placeholders.** Every page has executable code.
- **Sidecar pattern** introduced once in T1 and reused in T2/T3/T4/T5/T6/T8.

## Done definition

- All 8 detail pages reskinned.
- `<PageMeta>` and `<Sidecar>` primitives in `src/components/detail/`.
- 24+ tests pass; build/lint clean; single commit.
