# Design Phase 5 — Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Apply the design system to every auth-flow page so they read like the TurkishExporter sign-up panel — left-side brand-blue mockup illustration + right-side form card, compact inputs, KVKK-style consent, "If you have an account" footer link.

**Pages in scope (6):**
1. `/login` (likely `(auth)/login/page.tsx`)
2. `/register`
3. `/verify-email`
4. `/forgot-password`
5. `/reset-password`
6. `/dashboard/settings/account`

**No commits per task. No `git add`.** Single commit at end.

---

## File Structure

**Create:**
- `src/components/auth-design/auth-shell.tsx` — server component that renders the bi-fold layout (left mockup + right form).
- `src/components/auth-design/auth-mockup-panel.tsx` — left side brand-blue illustration with "Verified · Bilingual · Secure" check-row.
- `src/components/auth-design/auth-form-card.tsx` — right side card wrapper (title, subtitle, children, footer link).

**Modify:**
- `src/app/[locale]/(auth)/login/page.tsx`
- `src/app/[locale]/(auth)/register/page.tsx`
- `src/app/[locale]/(auth)/verify-email/page.tsx`
- `src/app/[locale]/(auth)/forgot-password/page.tsx`
- `src/app/[locale]/(auth)/reset-password/page.tsx`
- `src/app/[locale]/dashboard/settings/account/page.tsx`
- `src/config/messages/{en,fr}.json` — small `AuthDesign.*` keys (the mockup panel headline, check items, etc.).

---

## Task 1: i18n + 3 auth-design primitives

**Files:**
- Create: 3 new files in `src/components/auth-design/`
- Modify: en.json + fr.json (`AuthDesign.*`)

### i18n (`AuthDesign.*`)

EN:
```json
"AuthDesign": {
  "panel": {
    "title": "TradeInDRC",
    "tagline": "The official trade portal for the Democratic Republic of Congo",
    "checks": [
      "Verified Congolese exporters",
      "Bilingual platform (EN / FR)",
      "Free RFQs, secure messaging"
    ]
  }
}
```
FR:
```json
"AuthDesign": {
  "panel": {
    "title": "TradeInDRC",
    "tagline": "Le portail officiel du commerce de la République démocratique du Congo",
    "checks": [
      "Exportateurs congolais vérifiés",
      "Plateforme bilingue (EN / FR)",
      "RFQ gratuits, messagerie sécurisée"
    ]
  }
}
```

### `auth-shell.tsx` (server)

```tsx
import { ReactNode } from "react";
import { AuthMockupPanel } from "./auth-mockup-panel";

export async function AuthShell({ children, locale }: { children: ReactNode; locale: string }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-muted/30">
      <AuthMockupPanel locale={locale} />
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
```

### `auth-mockup-panel.tsx` (server)

```tsx
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

export async function AuthMockupPanel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "AuthDesign.panel" });
  const checks = t.raw("checks") as string[];
  return (
    <div className="hidden md:flex bg-primary text-primary-foreground p-10 flex-col justify-between">
      <div>
        <p className="text-2xl font-semibold">{t("title")}</p>
        <p className="text-sm opacity-90 mt-2 max-w-sm">{t("tagline")}</p>
      </div>
      <ul className="space-y-3">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-70">© {new Date().getFullYear()} TradeInDRC</p>
    </div>
  );
}
```

### `auth-form-card.tsx` (server)

```tsx
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFormCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="bg-card border rounded-md p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
      {footer && <div className="text-xs text-muted-foreground border-t pt-3">{footer}</div>}
    </div>
  );
}
```

### Verify

```bash
ls src/components/auth-design/
npm run build 2>&1 | tail -5
```

---

## Task 2: Reskin `/login` and `/register`

Both pages use the existing `<UserAuthForm>` (S1). Wrap the form in the new shell:

`src/app/[locale]/(auth)/login/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { UserAuthForm } from "@/components/auth/user-auth-form";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return (
    <AuthShell locale={locale}>
      <AuthFormCard
        title={t("loginTitle")}
        subtitle={t("loginDesc")}
        footer={
          <span>
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary underline">{t("signUp")}</Link>
          </span>
        }
      >
        <UserAuthForm mode="login" />
      </AuthFormCard>
    </AuthShell>
  );
}
```

`register/page.tsx` mirrors with `mode="signup"`, footer offering link to `/login`. Read the current page first — it may need extra props for sectors.

---

## Task 3: Reskin `/verify-email`, `/forgot-password`, `/reset-password`

Each becomes a tiny page that imports `AuthShell` + `AuthFormCard` and slots the existing form body inside. Read each current page; the forms are already in client components. Strip the existing outer wrapper (the `min-h-screen flex items-center…` div), keep only the form content, and wrap with `<AuthShell><AuthFormCard title=… subtitle=… footer=…><form…/></AuthFormCard></AuthShell>`.

Note: if the page is a client component containing `useState/useTranslations`, you may need to split into a server "page" that imports a client "form" sub-component. Simplest: keep the existing client component, just import it inside the new server page wrapper.

Concretely:
- Move the existing client component logic from `verify-email/page.tsx` to a new file `verify-email/form.tsx` (`"use client"`). Then make `page.tsx` a server component that wraps it in AuthShell/AuthFormCard.
- Same pattern for forgot-password and reset-password.

This is structurally cleaner and supports `getTranslations` (for the form-card title/subtitle) in the server page.

---

## Task 4: Reskin `/dashboard/settings/account`

This page lives inside the dashboard chrome — it should NOT use AuthShell (the dashboard has its own sidebar layout). Instead, just apply `<PageHeader>` from design-system and tighten paddings:

```tsx
"use client";
// ... existing imports ...
import { PageHeader } from "@/components/design";

export default function AccountSettingsPage() {
  // ... existing code ...
  return (
    <div className="max-w-3xl">
      <PageHeader title={t("title")} subtitle={!verified ? t("unverifiedBanner") : undefined} />
      {/* ... existing change-email and change-password forms ... */}
    </div>
  );
}
```

If the page is already a client component (per S1 it is), keep it client. Just swap the outer wrapper for `PageHeader` + a `max-w-3xl` container and tighten the form paddings (`space-y-4` between sections, `h-9` inputs).

---

## Task 5: Verify + commit

- `npx vitest run` — 24 tests.
- `npm run build` — clean.
- `npx eslint --quiet src/components/auth-design/ src/app/[locale]/(auth)/ src/app/[locale]/dashboard/settings/account/page.tsx`
- Orchestrator commits.

---

## Done definition

- 3 new auth-design primitives.
- AuthShell-wrapped on 5 auth routes (login, register, verify-email, forgot, reset).
- PageHeader on the account-settings dashboard page.
- 24/24 tests; build/lint clean.
