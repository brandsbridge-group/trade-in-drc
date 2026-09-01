# User dashboard rules

- All dashboard pages assume an authenticated session. Use `useAuth()` from `@/lib/auth/auth-provider` on the client; on the server use `createServerSupabaseClient()` from `@/lib/supabase/server`.
- Server state: React Query. Client state: Zustand. Do not invent new stores.
- Show optimistic UI for toggle-style mutations; use `toast.loading` → `toast.success/error` for long-running ones (NON_BLOCKING_UX).
- Unverified-email users see an amber banner on settings; sensitive mutations are blocked at the DB level by `is_email_verified()` (migration 00003).
