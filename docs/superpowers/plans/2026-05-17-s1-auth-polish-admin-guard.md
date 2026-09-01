# S1 — Auth Polish + Admin Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship email verification, password reset, account-settings (change email/password), and a hard frontend admin guard, plus create folder-scoped CLAUDE.md stubs so future slices stay lean.

**Architecture:** Use Supabase Auth's built-in email confirm + recovery flows (no custom email service). Move the admin layout to a Server Component shell that calls a new `requireAdmin()` helper which redirects non-admins before any client UI renders. Keep all new copy bilingual (EN/FR) under existing next-intl message files.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2 (`@supabase/ssr`), next-intl, shadcn/ui, sonner toasts, Vitest (newly added — for the one pure helper).

**Reference spec:** `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` §3 (S1).

---

## File Structure

**Create:**
- `src/lib/auth/require-admin.ts` — server-only helper that checks the session + `profiles.role`, redirects otherwise.
- `src/lib/auth/require-admin.test.ts` — unit test for the helper using a mocked supabase server client.
- `src/app/[locale]/admin/AdminLayoutClient.tsx` — the existing client sidebar (renamed, no logic change).
- `src/app/[locale]/(auth)/forgot-password/page.tsx` — request reset link.
- `src/app/[locale]/(auth)/reset-password/page.tsx` — set new password after click-through.
- `src/app/[locale]/(auth)/verify-email/page.tsx` — landing page after signup; offers resend.
- `src/app/[locale]/dashboard/settings/account/page.tsx` — change email + change password.
- `src/app/[locale]/admin/CLAUDE.md`
- `src/app/[locale]/dashboard/CLAUDE.md`
- `src/lib/supabase/CLAUDE.md`
- `supabase/migrations/CLAUDE.md`
- `src/i18n/CLAUDE.md`
- `src/components/ui/CLAUDE.md`
- `vitest.config.ts`
- `supabase/migrations/00003_email_verified_rls.sql` — require `auth.users.email_confirmed_at IS NOT NULL` on company/RFQ inserts.

**Modify:**
- `src/app/[locale]/admin/layout.tsx` — convert to Server Component, call `requireAdmin()`, render `<AdminLayoutClient>`.
- `src/app/[locale]/(auth)/register/page.tsx` — after signup, redirect to `/verify-email` with the email in query.
- `src/app/[locale]/(auth)/callback/route.ts` — handle both `code` (email confirm) and `type=recovery` (password reset) exchanges.
- `src/config/messages/en.json` — add `Auth.verifyEmail`, `Auth.forgotPassword`, `Auth.resetPassword`, `Auth.accountSettings`, `Admin.notAuthorized`.
- `src/config/messages/fr.json` — same keys, French.
- `package.json` — add vitest, @vitest/ui, jsdom, @testing-library/react dev deps; add `test` and `test:ui` scripts.
- `CLAUDE.md` (root) — already updated; no change here.

---

## Task 1: Install Vitest test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

Add under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify install**

Run: `npx vitest run --reporter=verbose` (expect "No test files found" — fine).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Write failing test for `requireAdmin()` helper

**Files:**
- Create: `src/lib/auth/require-admin.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

import { requireAdmin } from "./require-admin";

function setupProfile(role: string | null) {
  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: role ? { role } : null, error: null }),
      }),
    }),
  });
}

describe("requireAdmin", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getUserMock.mockReset();
    fromMock.mockReset();
  });

  it("redirects to /login when no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin("en")).rejects.toThrow("REDIRECT:/en/login?next=/admin");
  });

  it("redirects to / when user is not admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setupProfile("user");
    await expect(requireAdmin("fr")).rejects.toThrow("REDIRECT:/fr?error=not_authorized");
  });

  it("returns user when role is admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setupProfile("admin");
    const result = await requireAdmin("en");
    expect(result.id).toBe("u1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/require-admin.test.ts`
Expected: FAIL — `Cannot find module './require-admin'`.

- [ ] **Step 3: Commit (failing test allowed for TDD red phase)**

```bash
git add src/lib/auth/require-admin.test.ts
git commit -m "test: add failing test for requireAdmin helper"
```

---

## Task 3: Implement `requireAdmin()` helper

**Files:**
- Create: `src/lib/auth/require-admin.ts`

- [ ] **Step 1: Write the helper**

```ts
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function requireAdmin(locale: string) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(`/${locale}/login?next=/admin`);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role !== "admin") {
    redirect(`/${locale}?error=not_authorized`);
  }
  return data.user;
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/require-admin.test.ts`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/require-admin.ts
git commit -m "feat(auth): add requireAdmin server helper"
```

---

## Task 4: Convert admin layout to server-guarded shell

**Files:**
- Create: `src/app/[locale]/admin/AdminLayoutClient.tsx`
- Modify: `src/app/[locale]/admin/layout.tsx`

- [ ] **Step 1: Copy current client layout to `AdminLayoutClient.tsx`**

Move the entire current contents of `src/app/[locale]/admin/layout.tsx` (the `"use client"` component) into a new file `AdminLayoutClient.tsx`. Rename the exported component from `AdminLayout` to `AdminLayoutClient`. Keep all imports and JSX identical.

- [ ] **Step 2: Replace `layout.tsx` with server shell**

Overwrite `src/app/[locale]/admin/layout.tsx` with:

```tsx
import { requireAdmin } from "@/lib/auth/require-admin";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

- [ ] **Step 3: Manually verify the guard**

```bash
npm run dev
```
1. Visit `http://localhost:3000/en/admin` while logged out → should redirect to `/en/login?next=/admin`.
2. Log in as a non-admin user → visit `/en/admin` → should redirect to `/en?error=not_authorized`.
3. Promote your test user to admin in Supabase SQL: `update profiles set role='admin' where id='<uuid>';` → reload → admin renders.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/admin/layout.tsx src/app/[locale]/admin/AdminLayoutClient.tsx
git commit -m "feat(admin): server-side admin guard on /admin layout"
```

---

## Task 5: Migration — require verified email before publishing

**Files:**
- Create: `supabase/migrations/00003_email_verified_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 00003_email_verified_rls.sql
-- Block companies / rfq_listings inserts from users with unverified emails.

create or replace function public.is_email_verified() returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(
    (select email_confirmed_at is not null from auth.users where id = auth.uid()),
    false
  );
$$;

drop policy if exists "Owners can insert their company" on public.companies;
create policy "Owners can insert their company"
  on public.companies for insert
  with check (auth.uid() = owner_id and public.is_email_verified());

drop policy if exists "Owners can insert RFQs for their company" on public.rfq_listings;
create policy "Owners can insert RFQs for their company"
  on public.rfq_listings for insert
  with check (
    public.is_email_verified()
    and exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with `name=00003_email_verified_rls` and the SQL above. If the project uses local CLI instead, run `supabase db push`.

- [ ] **Step 3: Verify**

In Supabase SQL editor:
```sql
select policyname, with_check from pg_policies
where tablename in ('companies','rfq_listings') and cmd='INSERT';
```
Expect both policies to reference `is_email_verified()`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00003_email_verified_rls.sql
git commit -m "feat(db): require verified email before publishing companies/RFQs"
```

---

## Task 6: Add bilingual auth strings to message files

**Files:**
- Modify: `src/config/messages/en.json`
- Modify: `src/config/messages/fr.json`

- [ ] **Step 1: Add to `en.json` under the existing `Auth` key (merge with existing object)**

```json
{
  "Auth": {
    "verifyEmail": {
      "title": "Verify your email",
      "body": "We sent a confirmation link to {email}. Click it to activate your account.",
      "resend": "Resend email",
      "resent": "Email sent. Check your inbox.",
      "openInbox": "Open inbox"
    },
    "forgotPassword": {
      "title": "Reset your password",
      "body": "Enter the email tied to your account and we'll send you a reset link.",
      "submit": "Send reset link",
      "sent": "If that email exists, a link is on the way.",
      "backToLogin": "Back to login"
    },
    "resetPassword": {
      "title": "Choose a new password",
      "newPassword": "New password",
      "confirm": "Confirm password",
      "submit": "Update password",
      "success": "Password updated. You can log in now.",
      "mismatch": "Passwords don't match.",
      "weak": "Use at least 8 characters."
    },
    "accountSettings": {
      "title": "Account settings",
      "email": "Email",
      "changeEmail": "Change email",
      "newEmail": "New email",
      "password": "Password",
      "changePassword": "Change password",
      "currentPassword": "Current password",
      "saved": "Saved.",
      "emailChangeSent": "Confirm the change from your new inbox.",
      "unverifiedBanner": "Your email isn't verified yet. Some actions are blocked."
    }
  },
  "Admin": {
    "notAuthorized": "You don't have access to that area."
  }
}
```

- [ ] **Step 2: Add the same keys to `fr.json` with French strings**

```json
{
  "Auth": {
    "verifyEmail": {
      "title": "Vérifiez votre e-mail",
      "body": "Nous avons envoyé un lien de confirmation à {email}. Cliquez dessus pour activer votre compte.",
      "resend": "Renvoyer l'e-mail",
      "resent": "E-mail envoyé. Vérifiez votre boîte de réception.",
      "openInbox": "Ouvrir la boîte de réception"
    },
    "forgotPassword": {
      "title": "Réinitialiser votre mot de passe",
      "body": "Entrez l'e-mail lié à votre compte et nous vous enverrons un lien de réinitialisation.",
      "submit": "Envoyer le lien",
      "sent": "Si cet e-mail existe, un lien est en route.",
      "backToLogin": "Retour à la connexion"
    },
    "resetPassword": {
      "title": "Choisissez un nouveau mot de passe",
      "newPassword": "Nouveau mot de passe",
      "confirm": "Confirmez le mot de passe",
      "submit": "Mettre à jour",
      "success": "Mot de passe mis à jour. Vous pouvez vous connecter.",
      "mismatch": "Les mots de passe ne correspondent pas.",
      "weak": "Utilisez au moins 8 caractères."
    },
    "accountSettings": {
      "title": "Paramètres du compte",
      "email": "E-mail",
      "changeEmail": "Modifier l'e-mail",
      "newEmail": "Nouvel e-mail",
      "password": "Mot de passe",
      "changePassword": "Modifier le mot de passe",
      "currentPassword": "Mot de passe actuel",
      "saved": "Enregistré.",
      "emailChangeSent": "Confirmez le changement depuis votre nouvelle boîte de réception.",
      "unverifiedBanner": "Votre e-mail n'est pas encore vérifié. Certaines actions sont bloquées."
    }
  },
  "Admin": {
    "notAuthorized": "Vous n'avez pas accès à cette zone."
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/messages/en.json src/config/messages/fr.json
git commit -m "i18n(auth): add bilingual strings for verify/reset/account"
```

---

## Task 7: Build `/verify-email` page

**Files:**
- Create: `src/app/[locale]/(auth)/verify-email/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function VerifyEmailPage() {
  const t = useTranslations("Auth.verifyEmail");
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Missing email");
      return;
    }
    setSending(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(t("resent"));
  }

  return (
    <div className="mx-auto max-w-md py-16 px-4">
      <h1 className="text-2xl font-semibold mb-3">{t("title")}</h1>
      <p className="text-slate-600 mb-6">{t("body", { email })}</p>
      <div className="flex gap-2">
        <Button onClick={resend} disabled={sending}>{t("resend")}</Button>
        <Button variant="outline" asChild>
          <Link href="/login">{t("openInbox")}</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

```bash
npm run dev
```
Visit `/en/verify-email?email=test@example.com` → page renders with EN copy. Switch to `/fr/verify-email?email=test@example.com` → FR copy.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/[locale]/(auth)/verify-email/page.tsx'
git commit -m "feat(auth): add /verify-email page with resend"
```

---

## Task 8: Redirect signup to verify-email

**Files:**
- Modify: `src/app/[locale]/(auth)/register/page.tsx`

- [ ] **Step 1: Locate the post-signup redirect**

Open `src/app/[locale]/(auth)/register/page.tsx`. Find the signup `onSubmit` (or call to `supabase.auth.signUp`). It currently routes the user to the dashboard or login on success.

- [ ] **Step 2: Change the success redirect**

After a successful `signUp`, replace the redirect with:

```ts
router.push(`/verify-email?email=${encodeURIComponent(email)}`);
```

(Use `useRouter` from `@/i18n/routing` so locale is preserved.)

- [ ] **Step 3: Manually verify**

Register a new test account in dev. After submit, browser lands on `/verify-email?email=...` and a real confirm email arrives (assumes Supabase Auth → Email confirmations is ON in the dashboard).

- [ ] **Step 4: Commit**

```bash
git add 'src/app/[locale]/(auth)/register/page.tsx'
git commit -m "feat(auth): redirect signup to verify-email page"
```

---

## Task 9: Update callback route to handle recovery & email-change

**Files:**
- Modify: `src/app/[locale]/(auth)/callback/route.ts`

- [ ] **Step 1: Replace handler**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type"); // 'recovery' | 'signup' | 'email_change' | null
  const locale = url.pathname.split("/")[1] || "en";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  }

  const next =
    type === "recovery" ? `/${locale}/reset-password`
    : type === "email_change" ? `/${locale}/dashboard/settings/account?changed=1`
    : `/${locale}/dashboard`;

  return NextResponse.redirect(new URL(next, url.origin));
}
```

- [ ] **Step 2: Commit**

```bash
git add 'src/app/[locale]/(auth)/callback/route.ts'
git commit -m "feat(auth): callback handles recovery and email-change"
```

---

## Task 10: Build `/forgot-password` page

**Files:**
- Create: `src/app/[locale]/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, usePathname } from "@/i18n/routing";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth.forgotPassword");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/callback?type=recovery`,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(t("sent"));
  }

  return (
    <div className="mx-auto max-w-md py-16 px-4">
      <h1 className="text-2xl font-semibold mb-3">{t("title")}</h1>
      <p className="text-slate-600 mb-6">{t("body")}</p>
      <form onSubmit={submit} className="space-y-4">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Button type="submit" disabled={sending} className="w-full">{t("submit")}</Button>
      </form>
      <Link href="/login" className="block mt-4 text-sm text-slate-600 underline">{t("backToLogin")}</Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Visit `/en/forgot-password`, submit a known email, check inbox for reset link.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/[locale]/(auth)/forgot-password/page.tsx'
git commit -m "feat(auth): add /forgot-password page"
```

---

## Task 11: Build `/reset-password` page

**Files:**
- Create: `src/app/[locale]/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";

export default function ResetPasswordPage() {
  const t = useTranslations("Auth.resetPassword");
  const router = useRouter();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (p1.length < 8) { toast.error(t("weak")); return; }
    if (p1 !== p2) { toast.error(t("mismatch")); return; }
    setBusy(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("success"));
      router.push("/login");
    }
  }

  return (
    <div className="mx-auto max-w-md py-16 px-4">
      <h1 className="text-2xl font-semibold mb-6">{t("title")}</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input type="password" placeholder={t("newPassword")} value={p1} onChange={(e) => setP1(e.target.value)} required />
        <Input type="password" placeholder={t("confirm")} value={p2} onChange={(e) => setP2(e.target.value)} required />
        <Button type="submit" disabled={busy} className="w-full">{t("submit")}</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Click the email reset link → land on `/<locale>/reset-password` with an active session → set new password → redirected to login.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/[locale]/(auth)/reset-password/page.tsx'
git commit -m "feat(auth): add /reset-password page"
```

---

## Task 12: Build dashboard account-settings page

**Files:**
- Create: `src/app/[locale]/dashboard/settings/account/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccountSettingsPage() {
  const t = useTranslations("Auth.accountSettings");
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState<"email" | "pw" | null>(null);

  const verified = !!user?.email_confirmed_at;

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success(t("emailChangeSent"));
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) { toast.error("Use at least 8 characters."); return; }
    setBusy("pw");
    const supabase = createBrowserClient();
    // Re-auth: sign in with current password to confirm identity.
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPw,
    });
    if (reauthErr) { setBusy(null); toast.error(reauthErr.message); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(t("saved")); setCurrentPw(""); setNewPw(""); }
  }

  return (
    <div className="max-w-xl space-y-10 py-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {!verified && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("unverifiedBanner")}
        </div>
      )}

      <form onSubmit={changeEmail} className="space-y-3">
        <h2 className="font-medium">{t("changeEmail")}</h2>
        <p className="text-sm text-slate-500">{t("email")}: {user?.email}</p>
        <Input type="email" placeholder={t("newEmail")} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
        <Button type="submit" disabled={busy === "email"}>{t("changeEmail")}</Button>
      </form>

      <form onSubmit={changePassword} className="space-y-3">
        <h2 className="font-medium">{t("changePassword")}</h2>
        <Input type="password" placeholder={t("currentPassword")} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
        <Input type="password" placeholder={t("password")} value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
        <Button type="submit" disabled={busy === "pw"}>{t("changePassword")}</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Log in → visit `/en/dashboard/settings/account` → confirm both forms work end-to-end. If your email is unverified, the amber banner appears.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/[locale]/dashboard/settings/account/page.tsx'
git commit -m "feat(dashboard): account settings (change email + password)"
```

---

## Task 13: Surface `error=not_authorized` flash on home

**Files:**
- Modify: `src/app/[locale]/page.tsx` (or wherever the locale home is)

- [ ] **Step 1: Add a small client effect that reads `?error=` and toasts**

At the top of the home page, render a tiny client component:

Create `src/components/auth/auth-flash.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function AuthFlash() {
  const search = useSearchParams();
  const t = useTranslations("Admin");
  useEffect(() => {
    if (search.get("error") === "not_authorized") {
      toast.error(t("notAuthorized"));
    }
  }, [search, t]);
  return null;
}
```

Then mount it once in `src/app/[locale]/layout.tsx` near the top of `<body>` (alongside `<Toaster />`).

- [ ] **Step 2: Verify**

While logged in as non-admin, visit `/en/admin` → redirected to `/en?error=not_authorized` → toast says "You don't have access to that area."

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/auth-flash.tsx 'src/app/[locale]/layout.tsx'
git commit -m "feat(auth): flash 'not authorized' toast after admin redirect"
```

---

## Task 14: Folder-scoped CLAUDE.md stubs

**Files:** create six files. Content for each is included below in full.

- [ ] **Step 1: `src/app/[locale]/admin/CLAUDE.md`**

```markdown
# Admin area rules

- Every admin page is server-guarded by `requireAdmin()` in `src/lib/auth/require-admin.ts` via the parent `layout.tsx`. Do NOT skip the guard, even for "internal" tools.
- RLS is the source of truth for authorization. Frontend guards are UX only — assume the layout guard could be bypassed and write queries that fail safely under user RLS.
- NEVER import `src/lib/supabase/admin.ts` (service-role client) into any client component or any file that gets shipped to the browser. Service-role bypasses RLS.
- All admin copy must be bilingual (EN/FR) via next-intl. No hardcoded strings.
- Pages follow shadcn + compact, dense layout (see project memory: minimal padding, brand-color CTAs).
```

- [ ] **Step 2: `src/app/[locale]/dashboard/CLAUDE.md`**

```markdown
# User dashboard rules

- All dashboard pages assume an authenticated session. Use `useAuth()` from `@/lib/auth/auth-provider` on the client; on the server use `createServerClient()` from `@/lib/supabase/server`.
- Server state: React Query. Client state: Zustand. Do not invent new stores.
- Show optimistic UI for toggle-style mutations; use `toast.loading` → `toast.success/error` for long-running ones (NON_BLOCKING_UX).
- Unverified-email users see an amber banner on settings; sensitive mutations are blocked at the DB level by `is_email_verified()` (migration 00003).
```

- [ ] **Step 3: `src/lib/supabase/CLAUDE.md`**

```markdown
# Supabase client variants

Pick the right client for the surface — mixing them up causes RLS bypass or broken cookies.

| File | When to use |
|---|---|
| `client.ts` (`createBrowserClient`) | Client Components and hooks. Reads `NEXT_PUBLIC_*` envs. |
| `server.ts` (`createServerClient`) | Server Components, Route Handlers, Server Actions. Hydrates cookies via Next.js `cookies()`. |
| `middleware.ts` (`createMiddlewareClient`) | ONLY inside `src/middleware.ts` — refreshes the session cookie. |
| `admin.ts` (service-role) | Server-only privileged ops (e.g., admin scripts, edge functions). NEVER import from a client component or any file under `src/app/**/page.tsx` that ships to browser. |

If you're unsure which to use, default to `createServerClient()` from `server.ts`.
```

- [ ] **Step 4: `supabase/migrations/CLAUDE.md`**

```markdown
# Migration conventions

- Filename: `NNNNN_short_kebab_description.sql`, monotonically increasing.
- Every table: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`, and an `updated_at` trigger.
- RLS: `alter table X enable row level security;` immediately after `create table`. Add explicit policies — no "FOR ALL TO public USING (true)".
- Bilingual columns: pair `name_en text not null` with `name_fr text not null` (and `_en/_fr` for any user-facing field). Slugs: `slug text unique not null`.
- Helper SQL functions go in `public` and are `security definer set search_path = public` only when strictly needed.
- Never edit a shipped migration — write a new one. Migrations are append-only history.
```

- [ ] **Step 5: `src/i18n/CLAUDE.md`**

```markdown
# i18n rules

- Supported locales today: `en`, `fr` (see `routing.ts`). TR/ZH/ES are deferred to roadmap slice S9.
- Every user-facing string MUST live in `src/config/messages/{en,fr}.json`. No hardcoded English in JSX.
- Use `useTranslations("Namespace")` from `next-intl`, not raw imports of message JSON.
- Always use the locale-aware `Link`, `useRouter`, `usePathname`, `redirect` exported from `@/i18n/routing`. Do not import from `next/link` or `next/navigation` for navigation.
- When adding a new namespace, add it to BOTH `en.json` and `fr.json` in the same PR. CI will fail on missing keys (once configured).
- DB-stored content uses `_en` / `_fr` column pairs; read both, render based on `locale`.
```

- [ ] **Step 6: `src/components/ui/CLAUDE.md`**

```markdown
# shadcn/ui rules

- These components are generated by `npx shadcn@latest add <component>` and live here verbatim. Do not hand-modify the base files unless the change is upstream-compatible.
- Compose new variants OUTSIDE this folder (e.g., `src/components/<feature>/...`) by wrapping shadcn primitives.
- Theme: new-york style, Tailwind v4 tokens. Brand color = `--primary`. Use `cn()` from `@/lib/utils` for class merging.
- Animation: prefer Framer Motion at the feature layer; keep base UI components purely structural.
```

- [ ] **Step 7: Commit all six stubs**

```bash
git add 'src/app/[locale]/admin/CLAUDE.md' 'src/app/[locale]/dashboard/CLAUDE.md' src/lib/supabase/CLAUDE.md supabase/migrations/CLAUDE.md src/i18n/CLAUDE.md src/components/ui/CLAUDE.md
git commit -m "docs: add folder-scoped CLAUDE.md files for lean context"
```

---

## Task 15: Manual end-to-end verification

- [ ] **Step 1: Enable email confirmations in Supabase**

Supabase Dashboard → Authentication → Email → **Confirm email = ON**. Configure SMTP if using a custom sender; otherwise the default Supabase sender is fine for dev.

- [ ] **Step 2: Branded email templates (EN + FR copy)**

Authentication → Email Templates: paste short branded copy for "Confirm signup", "Reset password", "Change email". Keep the link/`{{ .ConfirmationURL }}` placeholder intact. French version goes in the same template — alternate sections or use Supabase's locale support if enabled.

- [ ] **Step 3: Run the smoke checklist**

| # | Step | Expected |
|---|---|---|
| 1 | Sign up new user in EN | Lands on `/en/verify-email?email=...`, email arrives |
| 2 | Click confirm link | Lands on `/en/dashboard` with session |
| 3 | Sign up new user in FR | All copy is French |
| 4 | Forgot password → submit known email | "If that email exists..." toast; email arrives |
| 5 | Click reset link → set new password | Lands on `/login`, can log in with new password |
| 6 | Change email in account settings | Confirmation email goes to NEW address; clicking it lands on `/dashboard/settings/account?changed=1` |
| 7 | Change password (correct current) | Success toast |
| 8 | Change password (wrong current) | Error toast, no change |
| 9 | Visit `/en/admin` logged out | Redirect to `/en/login?next=/admin` |
| 10 | Visit `/en/admin` as user (non-admin) | Redirect to `/en?error=not_authorized`, toast appears |
| 11 | Visit `/en/admin` as admin | Renders normally |
| 12 | As unverified user, try to create a company | DB rejects insert (RLS) |

- [ ] **Step 4: Run unit + lint**

```bash
npx vitest run
npm run lint
npm run build
```
All green.

- [ ] **Step 5: Final commit if anything was tweaked**

```bash
git add -A
git commit -m "chore(s1): tweaks from smoke verification" || true
```

---

## Self-Review notes

- **Spec coverage:** Email verify (T5, T7, T8, T15), password reset (T10, T11, T9), `requireAdmin()` (T2, T3, T4), account settings (T12), folder CLAUDE.md stubs (T14). All bullets in roadmap §3 covered.
- **Types/names consistent:** `requireAdmin(locale)` signature matches between test (T2), implementation (T3), and layout consumer (T4). `is_email_verified()` named identically in migration (T5) and referenced in CLAUDE.md stub (T14 step 2).
- **No placeholders:** every step contains code or commands. No "TBD" or "similar to" references.
- **Out-of-scope kept out:** no Trust Center, no News/Blog wiring, no extra locales — those belong to later slices.

---

## Done definition

S1 is done when **all 12 rows of Task 15's smoke checklist pass** AND `npx vitest run && npm run lint && npm run build` are green AND the six folder-scoped CLAUDE.md files exist on `main`.
