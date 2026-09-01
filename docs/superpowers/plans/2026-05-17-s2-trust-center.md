# S2 — Trust Center (public-facing) + Verification Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public Trust Center: explainer page, verification badges across the directory/marketplace, and per-company public trust reports. Add `verification_tier` to companies, plus schema-only KYP and KYC tables behind future work.

**Architecture:** Reuse the existing `companies` + `company_documents` + `verification_reviews` pipeline. Add a non-PII `verification_summary jsonb` field on `companies` that admins fill in when granting a tier — that's the only data exposed publicly. Raw documents stay RLS-locked. Badges read `companies.verification_tier` only.

**Tech Stack:** Next.js 16 App Router, Supabase, next-intl, shadcn/ui, Vitest (already installed in S1).

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §4 (S2).

**No commits per task** — orchestrator runs ship-wreck-check at end of slice and commits as one batch.

---

## File Structure

**Create:**
- `supabase/migrations/00004_trust_center.sql` — adds `verification_tier`, `verified_at`, `verification_summary` to `companies`; creates `kyp_checks` and `kyc_individuals` tables (schema only, RLS locked).
- `src/components/trust/verification-badge.tsx` — small badge component, reads `tier`, renders i18n label + color.
- `src/components/trust/trust-summary-card.tsx` — public-safe summary card for a company.
- `src/app/[locale]/trust/page.tsx` — Trust Center explainer (bilingual).
- `src/app/[locale]/trust/[companySlug]/page.tsx` — per-company public trust report.
- `src/lib/trust/types.ts` — TypeScript types for `VerificationTier`, `VerificationSummary`.
- `src/lib/trust/labels.ts` — pure mapping `tier -> { color, badgeKey }`.
- `src/lib/trust/labels.test.ts` — unit test for the mapping.

**Modify:**
- `src/config/messages/en.json` + `src/config/messages/fr.json` — add `Trust.*` namespace.
- `src/app/[locale]/admin/companies/[id]/page.tsx` — add a tier selector + summary editor (admin only).
- `src/app/[locale]/companies/page.tsx` and `src/app/[locale]/companies/[id]/page.tsx` — render `<VerificationBadge tier={...} />`.
- `src/app/[locale]/products/page.tsx` and `src/app/[locale]/products/[id]/page.tsx` — render the badge on product cards/details where company info appears.
- `src/config/navigation.ts` — add a Trust link to top nav (under About or its own item — decide during T6).
- `supabase/migrations/CLAUDE.md` — append a one-line note about `verification_tier` enum being canonical (next free: 00005).

---

## Tier model (locked here so all tasks agree)

```ts
export type VerificationTier = "none" | "basic" | "verified" | "premium";

export interface VerificationSummary {
  // Non-PII, admin-curated, safe to render publicly.
  checks: Array<{
    key: "kyb" | "address" | "tax" | "license" | "site_visit" | "audit";
    status: "passed" | "pending" | "failed";
    note_en?: string;
    note_fr?: string;
    completed_at?: string; // ISO date
  }>;
  notes_en?: string;
  notes_fr?: string;
}
```

The `verification_summary` column stores exactly this JSON shape.

---

## Task 1: Migration `00004_trust_center.sql`

**Files:**
- Create: `supabase/migrations/00004_trust_center.sql`

- [ ] **Step 1: Read 00001 + 00003 first**

Confirm the EXACT name of the `companies` table, that `id uuid` is its PK, and the project's convention for `check` constraints / `default` clauses (so 00004 matches style).

- [ ] **Step 2: Write the migration**

```sql
-- 00004_trust_center.sql
-- Adds public-facing verification tier + curated public summary to companies.
-- Creates schema-only KYP and KYC tables (RLS locked) for future slices.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_tier text
    NOT NULL DEFAULT 'none'
    CHECK (verification_tier IN ('none','basic','verified','premium')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_summary jsonb;

COMMENT ON COLUMN public.companies.verification_summary IS
  'Public-safe JSON, shape defined in src/lib/trust/types.ts (VerificationSummary). Never store PII here.';

-- KYP: per-product verification checks (schema only — no UI in S2).
CREATE TABLE IF NOT EXISTS public.kyp_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('origin','quality','quantity','custom')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed')),
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyp_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyp_checks_admin_all" ON public.kyp_checks
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- KYC: per-individual verification checks (schema only).
CREATE TABLE IF NOT EXISTS public.kyc_individuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_doc_status text NOT NULL DEFAULT 'pending' CHECK (id_doc_status IN ('pending','passed','failed')),
  address_status text NOT NULL DEFAULT 'pending' CHECK (address_status IN ('pending','passed','failed')),
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_individuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kyc_individuals_admin_all" ON public.kyc_individuals
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "kyc_individuals_owner_read" ON public.kyc_individuals
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- updated_at triggers (reuse project convention if a helper exists; otherwise inline).
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS kyp_checks_updated ON public.kyp_checks;
CREATE TRIGGER kyp_checks_updated BEFORE UPDATE ON public.kyp_checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS kyc_individuals_updated ON public.kyc_individuals;
CREATE TRIGGER kyc_individuals_updated BEFORE UPDATE ON public.kyc_individuals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
```

If `public.touch_updated_at()` already exists from earlier migrations, the `CREATE OR REPLACE` is harmless — keep it.

- [ ] **Step 3: Do not apply.** The Supabase project is paused as of 2026-05-17; orchestrator will `supabase db push` after unpause.

---

## Task 2: Types + label mapping (TDD)

**Files:**
- Create: `src/lib/trust/types.ts`
- Create: `src/lib/trust/labels.ts`
- Create: `src/lib/trust/labels.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { tierLabel, tierTone } from "./labels";

describe("trust labels", () => {
  it("returns badge i18n key per tier", () => {
    expect(tierLabel("none")).toBe("badge.none");
    expect(tierLabel("basic")).toBe("badge.basic");
    expect(tierLabel("verified")).toBe("badge.verified");
    expect(tierLabel("premium")).toBe("badge.premium");
  });
  it("returns visual tone per tier", () => {
    expect(tierTone("verified")).toBe("emerald");
    expect(tierTone("premium")).toBe("indigo");
    expect(tierTone("basic")).toBe("slate");
    expect(tierTone("none")).toBe("muted");
  });
});
```

Run: `npx vitest run src/lib/trust/labels.test.ts` → FAIL.

- [ ] **Step 2: Write the implementations**

`src/lib/trust/types.ts`:
```ts
export type VerificationTier = "none" | "basic" | "verified" | "premium";

export interface VerificationCheck {
  key: "kyb" | "address" | "tax" | "license" | "site_visit" | "audit";
  status: "passed" | "pending" | "failed";
  note_en?: string;
  note_fr?: string;
  completed_at?: string;
}

export interface VerificationSummary {
  checks: VerificationCheck[];
  notes_en?: string;
  notes_fr?: string;
}
```

`src/lib/trust/labels.ts`:
```ts
import type { VerificationTier } from "./types";

export function tierLabel(t: VerificationTier): string {
  return `badge.${t}` as const;
}

export type TrustTone = "muted" | "slate" | "emerald" | "indigo";
export function tierTone(t: VerificationTier): TrustTone {
  switch (t) {
    case "premium": return "indigo";
    case "verified": return "emerald";
    case "basic": return "slate";
    case "none":
    default: return "muted";
  }
}
```

Run: `npx vitest run src/lib/trust/labels.test.ts` → PASS.

---

## Task 3: VerificationBadge component

**Files:**
- Create: `src/components/trust/verification-badge.tsx`

- [ ] **Step 1: Read first**

Read `src/components/ui/badge.tsx` to confirm the shadcn Badge variants in use. Read one place that already renders company status (e.g. `src/app/[locale]/companies/page.tsx`) to match styling density.

- [ ] **Step 2: Write the component**

```tsx
"use client";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierTone, tierLabel, type TrustTone } from "@/lib/trust/labels";
import type { VerificationTier } from "@/lib/trust/types";

const toneClasses: Record<TrustTone, string> = {
  muted: "bg-muted text-muted-foreground border-transparent",
  slate: "bg-slate-100 text-slate-800 border-slate-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

const iconByTier: Record<VerificationTier, React.ElementType> = {
  none: ShieldAlert,
  basic: ShieldCheck,
  verified: CheckCircle2,
  premium: Sparkles,
};

export function VerificationBadge({ tier, className }: { tier: VerificationTier; className?: string }) {
  const t = useTranslations("Trust");
  const Icon = iconByTier[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full",
        toneClasses[tierTone(tier)],
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {t(tierLabel(tier))}
    </span>
  );
}
```

---

## Task 4: Trust messages namespace (EN + FR)

**Files:**
- Modify: `src/config/messages/en.json`
- Modify: `src/config/messages/fr.json`

- [ ] **Step 1: Read both files. Merge under a new top-level `Trust` key.**

EN:
```json
"Trust": {
  "navLabel": "Trust Center",
  "page": {
    "title": "Trust Center",
    "subtitle": "How we verify Congolese exporters before they appear on TradeInDRC.",
    "kybTitle": "Know Your Business (KYB)",
    "kybBody": "We confirm a company's legal existence, address, and tax registration.",
    "kypTitle": "Know Your Product (KYP)",
    "kypBody": "We verify origin, quality, and quantity of headline products on request.",
    "kycTitle": "Know Your Customer (KYC)",
    "kycBody": "We verify the identity of buyers and partners involved in deals.",
    "tiersTitle": "Verification tiers"
  },
  "report": {
    "title": "Trust report for {company}",
    "noSummary": "No public verification details are available yet.",
    "lastUpdated": "Last updated {date}",
    "checks": {
      "kyb": "Legal & business identity",
      "address": "Address verification",
      "tax": "Tax registration",
      "license": "Operating license",
      "site_visit": "On-site visit",
      "audit": "Independent audit"
    },
    "status": { "passed": "Passed", "pending": "Pending", "failed": "Failed" }
  },
  "badge": {
    "none": "Not verified",
    "basic": "Basic",
    "verified": "Verified",
    "premium": "Premium"
  },
  "admin": {
    "tierLabel": "Verification tier",
    "summaryLabel": "Public summary (JSON)",
    "save": "Save trust profile",
    "saved": "Trust profile updated.",
    "invalidJson": "Summary is not valid JSON."
  }
}
```

FR (translations — keep the same shape):
```json
"Trust": {
  "navLabel": "Centre de confiance",
  "page": {
    "title": "Centre de confiance",
    "subtitle": "Comment nous vérifions les exportateurs congolais avant leur affichage sur TradeInDRC.",
    "kybTitle": "Connaître votre entreprise (KYB)",
    "kybBody": "Nous confirmons l'existence légale, l'adresse et l'enregistrement fiscal d'une entreprise.",
    "kypTitle": "Connaître votre produit (KYP)",
    "kypBody": "Nous vérifions l'origine, la qualité et la quantité des produits phares sur demande.",
    "kycTitle": "Connaître votre client (KYC)",
    "kycBody": "Nous vérifions l'identité des acheteurs et partenaires impliqués dans les transactions.",
    "tiersTitle": "Niveaux de vérification"
  },
  "report": {
    "title": "Rapport de confiance pour {company}",
    "noSummary": "Aucun détail de vérification public n'est encore disponible.",
    "lastUpdated": "Dernière mise à jour {date}",
    "checks": {
      "kyb": "Identité légale et commerciale",
      "address": "Vérification de l'adresse",
      "tax": "Enregistrement fiscal",
      "license": "Licence d'exploitation",
      "site_visit": "Visite sur site",
      "audit": "Audit indépendant"
    },
    "status": { "passed": "Réussi", "pending": "En attente", "failed": "Échoué" }
  },
  "badge": {
    "none": "Non vérifié",
    "basic": "Basique",
    "verified": "Vérifié",
    "premium": "Premium"
  },
  "admin": {
    "tierLabel": "Niveau de vérification",
    "summaryLabel": "Résumé public (JSON)",
    "save": "Enregistrer le profil",
    "saved": "Profil mis à jour.",
    "invalidJson": "Le résumé n'est pas du JSON valide."
  }
}
```

---

## Task 5: Public `/trust` page

**Files:**
- Create: `src/app/[locale]/trust/page.tsx`

- [ ] **Step 1: Read `src/app/[locale]/about/[slug]/page.tsx`** (or any static content page) to match the project's `setRequestLocale` + `getTranslations` pattern used by static server pages.

- [ ] **Step 2: Write the page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Trust.page" });

  const pillars = [
    { titleKey: "kybTitle", bodyKey: "kybBody" },
    { titleKey: "kypTitle", bodyKey: "kypBody" },
    { titleKey: "kycTitle", bodyKey: "kycBody" },
  ] as const;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("subtitle")}</p>

      <section className="grid gap-4 md:grid-cols-3 mb-10">
        {pillars.map((p) => (
          <div key={p.titleKey} className="border rounded-md p-4 bg-card">
            <h2 className="font-medium mb-2">{t(p.titleKey)}</h2>
            <p className="text-sm text-muted-foreground">{t(p.bodyKey)}</p>
          </div>
        ))}
      </section>

      <h2 className="text-xl font-semibold mb-3">{t("tiersTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        {(["none","basic","verified","premium"] as const).map((tier) => (
          <TierSample key={tier} tier={tier} />
        ))}
      </div>
    </main>
  );
}

import { VerificationBadge } from "@/components/trust/verification-badge";
function TierSample({ tier }: { tier: "none" | "basic" | "verified" | "premium" }) {
  return <VerificationBadge tier={tier} />;
}
```

---

## Task 6: Per-company public trust report `/trust/[companySlug]`

**Files:**
- Create: `src/app/[locale]/trust/[companySlug]/page.tsx`
- Create: `src/components/trust/trust-summary-card.tsx`

- [ ] **Step 1: Read existing company detail page** (`src/app/[locale]/companies/[id]/page.tsx`) to see how it loads a company, whether it queries by `id` or `slug`, and the project's preferred data-fetching style for server pages.

- [ ] **Step 2: Implement the loader and page**

If companies have a `slug` column already, query by slug. If they only have `id`, the route param is the id; rename the dynamic segment to `[id]` to match.

`trust-summary-card.tsx`:
```tsx
import type { VerificationSummary, VerificationCheck } from "@/lib/trust/types";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

const icon = {
  passed: CheckCircle2,
  pending: AlertCircle,
  failed: XCircle,
};

export async function TrustSummaryCard({
  summary,
  locale,
}: {
  summary: VerificationSummary | null;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Trust.report" });
  if (!summary || !summary.checks?.length) {
    return <p className="text-muted-foreground">{t("noSummary")}</p>;
  }
  return (
    <ul className="space-y-2">
      {summary.checks.map((c: VerificationCheck, idx) => {
        const Icon = icon[c.status];
        const tone =
          c.status === "passed" ? "text-emerald-700"
          : c.status === "failed" ? "text-red-700"
          : "text-amber-700";
        const note = locale === "fr" ? c.note_fr : c.note_en;
        return (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Icon className={`w-4 h-4 mt-0.5 ${tone}`} />
            <div>
              <div className="font-medium">{t(`checks.${c.key}`)}</div>
              <div className="text-muted-foreground">{t(`status.${c.status}`)}{note ? ` — ${note}` : ""}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

`src/app/[locale]/trust/[companySlug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { TrustSummaryCard } from "@/components/trust/trust-summary-card";
import type { VerificationSummary, VerificationTier } from "@/lib/trust/types";

export default async function CompanyTrustReportPage({
  params,
}: {
  params: Promise<{ locale: string; companySlug: string }>;
}) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);
  const supabase = await createServerSupabaseClient();

  // Adjust column to the project's actual key (id vs. slug). See Task 6 Step 1.
  const { data } = await supabase
    .from("companies")
    .select("id, name, verification_tier, verified_at, verification_summary")
    .eq("id", companySlug)            // change to .eq("slug", companySlug) if slug exists
    .eq("status", "verified")
    .single();

  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "Trust.report" });
  const tier = (data.verification_tier ?? "none") as VerificationTier;
  const summary = (data.verification_summary ?? null) as VerificationSummary | null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-semibold">{t("title", { company: data.name })}</h1>
        <VerificationBadge tier={tier} />
      </div>
      {data.verified_at && (
        <p className="text-xs text-muted-foreground mb-6">
          {t("lastUpdated", { date: new Date(data.verified_at).toLocaleDateString(locale) })}
        </p>
      )}
      <div className="border rounded-md p-4 bg-card">
        <TrustSummaryCard summary={summary} locale={locale} />
      </div>
    </main>
  );
}
```

---

## Task 7: Surface badges in directory + product listings

**Files:**
- Modify: `src/app/[locale]/companies/page.tsx`
- Modify: `src/app/[locale]/companies/[id]/page.tsx`
- Modify: `src/app/[locale]/products/page.tsx`
- Modify: `src/app/[locale]/products/[id]/page.tsx`

- [ ] **Step 1:** Add `verification_tier` to the `select` in each company/product query (products join the company).
- [ ] **Step 2:** Render `<VerificationBadge tier={company.verification_tier ?? "none"} />` near the company name in each card / header. Match existing typography density.
- [ ] **Step 3:** On the company detail page, add a "View trust report" link to `/<locale>/trust/<id>` (or slug).

The exact JSX depends on how each page renders today — the implementer reads each file, then inserts the badge in the natural place.

---

## Task 8: Admin tier editor

**Files:**
- Modify: `src/app/[locale]/admin/companies/[id]/page.tsx`

- [ ] **Step 1: Read the current admin company detail page.**

- [ ] **Step 2: Add a "Trust profile" card**

Below whatever exists today, add:
- A `<Select>` (shadcn) bound to `verification_tier` (options: none/basic/verified/premium).
- A `<Textarea>` containing the current `verification_summary` JSON (pretty-printed). On save, parse with `try { JSON.parse(value) } catch { toast.error(t("Trust.admin.invalidJson")) }`.
- A "Save trust profile" button that updates `companies` with `{ verification_tier, verification_summary, verified_at: now() if tier !== 'none' }`.

This is admin-only — RLS already enforces it.

- [ ] **Step 3:** Toast on success with `t("Trust.admin.saved")`.

---

## Task 9: Navigation entry for Trust Center

**Files:**
- Modify: `src/config/navigation.ts`

- [ ] **Step 1:** Read the existing `NAVIGATION_CONFIG` structure.
- [ ] **Step 2:** Add a top-level item or a sub-item under "About" with `label: "Trust"` (uses `t("Trust.navLabel")`) and `href: "/trust"`.

Don't overhaul navigation — one entry, in the same shape as siblings.

---

## Task 10: Verification

- [ ] **Step 1:** `npx vitest run` — 4+ tests pass (the 3 from S1 + the new labels test).
- [ ] **Step 2:** `npm run build` — clean.
- [ ] **Step 3:** `npx eslint <touched-files>` — clean.
- [ ] **Step 4:** Hand off to orchestrator for ship-wreck-check + commit + S3.

---

## Self-Review

- **Spec coverage:** §4 of master roadmap covered — badges (T3, T7), public Trust page (T5), per-company report (T6), admin tier editor (T8), `verification_tier`/`verified_at`/`verification_summary` columns (T1), schema-only KYP/KYC (T1).
- **Type consistency:** `VerificationTier` defined once in `src/lib/trust/types.ts`, imported everywhere.
- **No placeholders:** every task has code + commands + acceptance criteria.
- **Security:** raw documents stay private (no T touches `company_documents`); `verification_summary` is explicitly non-PII per migration comment + plan note.

---

## Done definition

- All 10 tasks complete, tests/lint/build green, ship-wreck-check passes.
- Migration `00004_trust_center.sql` committed (apply via `supabase db push` blocked until project unpaused).
- `/trust` and `/trust/[id]` reachable in both locales.
- Verification badges visible on companies + products lists/details.
- Admin can change a company's tier and edit its public summary JSON.
