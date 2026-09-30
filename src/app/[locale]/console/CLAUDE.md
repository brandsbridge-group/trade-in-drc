# Staff console rules (`/console`)

- This is the **staff** back-office (Super Admin + Moderator). It was called `/admin` until 2026-09-30; old URLs 308-redirect here (`next.config.ts`). In product language "Admin" now means a **company owner** in `/dashboard` — never call this area "admin" in new copy or routes. Full role/route model: `docs/context/roles-and-access.md`.
- Every page is server-guarded via the parent `layout.tsx` (`requireStaff()` in `src/lib/auth/require-admin.ts`). Do NOT skip the guard, even for "internal" tools.
- Sections that grant privilege or change platform settings are **super-admin only**: list them in `SUPER_ADMIN_ROUTES` (`src/constants/routes.ts`) AND guard their server actions with `requireSuperAdmin()`, not `requireAdmin()`. The proxy and sidebar read the same list.
- Link with `ROUTES.CONSOLE*` constants, not string literals.
- RLS is the source of truth for authorization. Frontend guards are UX only — assume the layout guard could be bypassed and write queries that fail safely under user RLS.
- NEVER import `src/lib/supabase/admin.ts` (service-role client) into any client component or any file that gets shipped to the browser. Service-role bypasses RLS.
- All console copy must be translated via next-intl (the message namespace is still `Admin.*`). No hardcoded strings.
- Pages follow shadcn + compact, dense layout (see project memory: minimal padding, brand-color CTAs).
