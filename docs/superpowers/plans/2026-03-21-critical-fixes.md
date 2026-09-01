# Critical Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 13 gaps identified in the brutal gap analysis — 6 critical, 4 high, 3 medium.

**Architecture:** Targeted fixes to existing files. No new architecture — just completing what's missing and fixing what's broken.

**Tech Stack:** Next.js 16, Supabase, next-intl, shadcn/ui, Lucide

---

## File Structure

### Files to Create

| File | Responsibility |
|---|---|
| `src/app/[locale]/(auth)/login/page.tsx` | Login page (renders auth form) |

### Files to Modify

| File | Change |
|---|---|
| `src/app/[locale]/products/[id]/page.tsx` | Connect to Supabase instead of static data |
| `src/app/[locale]/companies/[id]/page.tsx` | Smart contact button (modal if logged in, login if not) |
| `src/components/rfq/rfq-card.tsx` | Smart contact action |
| `src/components/layout/navbar.tsx` | Add admin panel link for admin users |
| `src/app/[locale]/layout.tsx` | Conditionally hide Navbar/Footer on dashboard/admin routes |
| `src/components/auth/user-auth-form.tsx` | Remove dead `redirectAfterAuth` function |
| `src/middleware.ts` | Select `role` not `*` from profiles |
| `src/app/[locale]/(auth)/callback/route.ts` | Add locale to redirect path |
| `src/lib/analytics/track-event.ts` | Already exists — just needs to be called from more pages |
| `src/app/[locale]/(public)/rfq/page.tsx` | Add trackEvent calls |
| `supabase/migrations/00001_initial_schema.sql` | Add `is_admin()` helper function |

### Files to Delete

| File | Reason |
|---|---|
| `src/data/mock-content.ts` | Dead mock data file — products are now from Supabase |

---

## Task 1: Create Login Page (CRITICAL — fixes 404 on auth redirect)

**Files:**
- Create: `src/app/[locale]/(auth)/login/page.tsx`

- [ ] **Step 1: Create login page**

```typescript
import { UserAuthForm } from "@/components/auth/user-auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-8">
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to access your account
          </p>
        </div>
        <div className="bg-card border rounded-md p-6">
          <UserAuthForm />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — navigate to `/en/login`, should render the auth form (not 404)

- [ ] **Step 3: Commit**
```bash
git add "src/app/[locale]/(auth)/login/page.tsx"
git commit -m "feat: add login page — fixes 404 on auth redirect"
```

---

## Task 2: Connect Products Detail Page to Supabase (CRITICAL)

**Files:**
- Modify: `src/app/[locale]/products/[id]/page.tsx`

- [ ] **Step 1: Read the current file** to understand its structure (it uses mock data)

- [ ] **Step 2: Rewrite to fetch from Supabase**

Replace the static/mock product data with a Supabase query:
```typescript
const supabase = createClient();
const { data: product } = await supabase
  .from('products')
  .select('*, companies(id, name, city, province, status, owner_id, sector_id, sectors(name_en, name_fr))')
  .eq('id', id)
  .single();
```

- Show product name, description, images, specs
- Show parent company info (name, location, sector)
- "Contact Company" button — same smart logic as Task 3 (modal if logged in, login if not)
- Related products: query other products from same company
- Add `trackEvent('product', id, 'view')` on mount
- Keep compact design (text-sm, p-4)
- Handle not-found case

- [ ] **Step 3: Delete `src/data/mock-content.ts`** if no longer imported anywhere

- [ ] **Step 4: Commit**
```bash
git commit -m "feat: connect product detail page to Supabase, add tracking"
```

---

## Task 3: Smart Contact Button on Company Profile (CRITICAL)

**Files:**
- Modify: `src/app/[locale]/companies/[id]/page.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Replace the hardcoded login link with smart logic**

Currently: `<Link href="/login">Contact This Company</Link>` (always shows login link)

Replace with:
- If user is logged in AND user is not the company owner → open `ContactSupplierModal`
- If user is logged in AND user IS the owner → show "This is your company"
- If user is NOT logged in → redirect to login with `?redirect=` back to this page

```typescript
// Add state for modal
const [showContactModal, setShowContactModal] = useState(false);
const { user } = useAuth();

// In the CTA section:
{user ? (
  user.id !== company.owner_id ? (
    <>
      <Button size="sm" className="w-full" onClick={() => setShowContactModal(true)}>
        Contact This Company
      </Button>
      <ContactSupplierModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        companyId={company.id}
        companyName={company.name}
        companyOwnerId={company.owner_id}
      />
    </>
  ) : (
    <p className="text-xs text-muted-foreground text-center">This is your company</p>
  )
) : (
  <Button size="sm" className="w-full" asChild>
    <Link href={`/login?redirect=/companies/${company.id}`}>
      Sign in to Contact
    </Link>
  </Button>
)}
```

- [ ] **Step 3: Import `ContactSupplierModal` and `useAuth`**

- [ ] **Step 4: Commit**
```bash
git commit -m "fix: smart contact button — modal when logged in, login redirect when not"
```

---

## Task 4: Smart Contact on RFQ Cards (CRITICAL)

**Files:**
- Modify: `src/components/rfq/rfq-card.tsx`
- Modify: `src/app/[locale]/(public)/rfq/page.tsx`

- [ ] **Step 1: Read rfq-card.tsx** — check how the contact action works

- [ ] **Step 2: Update RFQ card** to accept `onContact` callback prop instead of hardcoded link:
```typescript
interface RfqCardProps {
  listing: RfqListing;
  onContact?: (listing: RfqListing) => void;
}
```

- [ ] **Step 3: Update RFQ page** — if user logged in, clicking contact opens `ContactSupplierModal` with the listing's company. If not logged in, redirect to login.

- [ ] **Step 4: Add `trackEvent('rfq', listing.id, 'view')` on RFQ page mount**

- [ ] **Step 5: Commit**
```bash
git commit -m "fix: smart contact on RFQ listings, add analytics tracking"
```

---

## Task 5: Navbar Admin Link (CRITICAL)

**Files:**
- Modify: `src/components/layout/navbar.tsx`

- [ ] **Step 1: Read the navbar** — find the user dropdown menu

- [ ] **Step 2: Add admin role check and link**

After sign-in, fetch the user's role and conditionally show "Admin Panel" link:
```typescript
// Add state + effect to check role
const [userRole, setUserRole] = useState<string | null>(null);

useEffect(() => {
  if (!user) return;
  const supabase = createClient();
  supabase.from('profiles').select('role').eq('id', user.id).single()
    .then(({ data }) => setUserRole(data?.role ?? null));
}, [user]);

// In dropdown, before the sign out item:
{userRole === 'admin' && (
  <DropdownMenuItem asChild>
    <Link href="/admin" className="cursor-pointer">
      <Shield className="mr-2 h-4 w-4" />
      Admin Panel
    </Link>
  </DropdownMenuItem>
)}
```

- [ ] **Step 3: Import `Shield` from lucide-react and `createClient`**

- [ ] **Step 4: Commit**
```bash
git commit -m "feat: add Admin Panel link in navbar for admin users"
```

---

## Task 6: Hide Navbar/Footer on Dashboard & Admin Routes (CRITICAL)

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Read the root layout**

- [ ] **Step 2: Create a layout wrapper that conditionally renders Navbar/Footer**

Option: Create a small client component that checks the pathname:

```typescript
// src/components/layout/layout-shell.tsx
"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { CookieConsent } from "./cookie-consent";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.includes('/dashboard');
  const isAdmin = pathname.includes('/admin');
  const hideChrome = isDashboard || isAdmin;

  return (
    <>
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && <Footer />}
      {!hideChrome && <CookieConsent />}
    </>
  );
}
```

- [ ] **Step 3: Update root layout** to use `LayoutShell` instead of directly rendering Navbar/Footer

- [ ] **Step 4: Remove `fixed inset-0 z-50` hack from dashboard layout** — no longer needed since Navbar/Footer won't render

- [ ] **Step 5: Commit**
```bash
git commit -m "fix: conditionally hide Navbar/Footer on dashboard and admin routes"
```

---

## Task 7: Clean Up Dead Code in Auth Form (HIGH)

**Files:**
- Modify: `src/components/auth/user-auth-form.tsx`

- [ ] **Step 1: Remove the unused `redirectAfterAuth` function** — inline redirect was added but old function left behind

- [ ] **Step 2: Remove unused `pathname` variable** if no longer referenced

- [ ] **Step 3: Commit**
```bash
git commit -m "refactor: remove dead redirectAfterAuth code from auth form"
```

---

## Task 8: Fix Middleware Profile Query (MEDIUM)

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Change `.select('*')` to `.select('role')`** on the profiles query in the admin route check. Don't leak full profile data in middleware.

- [ ] **Step 2: Commit**
```bash
git commit -m "fix: middleware selects only role from profiles, not *"
```

---

## Task 9: Fix OAuth Callback Locale (MEDIUM)

**Files:**
- Modify: `src/app/[locale]/(auth)/callback/route.ts`

- [ ] **Step 1: Read the current callback route**

- [ ] **Step 2: Extract locale from the URL path and prepend to redirect**

```typescript
export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';

  // Extract locale from pathname (e.g., /en/callback → en)
  const localeMatch = pathname.match(/^\/(en|fr)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Ensure redirect has locale prefix
  const redirectPath = redirect.startsWith(`/${locale}`) ? redirect : `/${locale}${redirect}`;
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
```

- [ ] **Step 3: Commit**
```bash
git commit -m "fix: OAuth callback adds locale prefix to redirect path"
```

---

## Task 10: Add `is_admin()` SQL Helper (MEDIUM)

**Files:**
- Create: `supabase/migrations/00002_add_is_admin_helper.sql`

- [ ] **Step 1: Create migration**

```sql
-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Note: This does NOT rewrite existing policies (too risky). New policies going forward should use `is_admin()`. Existing policies work fine — just duplicated.

- [ ] **Step 2: Commit**
```bash
git commit -m "feat: add is_admin() SQL helper function for future RLS policies"
```

---

## Summary

| Task | Severity | Description | Files |
|---|---|---|---|
| 1 | CRITICAL | Create `/login` page | 1 new |
| 2 | CRITICAL | Product detail → Supabase | 1 modified, 1 deleted |
| 3 | CRITICAL | Smart contact on company profile | 1 modified |
| 4 | CRITICAL | Smart contact on RFQ cards | 2 modified |
| 5 | CRITICAL | Admin link in navbar | 1 modified |
| 6 | CRITICAL | Hide Navbar/Footer on dashboards | 2 modified, 1 new |
| 7 | HIGH | Remove dead auth code | 1 modified |
| 8 | MEDIUM | Middleware `.select('role')` | 1 modified |
| 9 | MEDIUM | OAuth callback locale | 1 modified |
| 10 | MEDIUM | `is_admin()` SQL helper | 1 new |

**Total: 3 new files, 10 modified, 1 deleted, 10 commits**
