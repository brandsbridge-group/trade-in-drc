# Admin area rules

- Every admin page is server-guarded by `requireAdmin()` in `src/lib/auth/require-admin.ts` via the parent `layout.tsx`. Do NOT skip the guard, even for "internal" tools.
- RLS is the source of truth for authorization. Frontend guards are UX only — assume the layout guard could be bypassed and write queries that fail safely under user RLS.
- NEVER import `src/lib/supabase/admin.ts` (service-role client) into any client component or any file that gets shipped to the browser. Service-role bypasses RLS.
- All admin copy must be bilingual (EN/FR) via next-intl. No hardcoded strings.
- Pages follow shadcn + compact, dense layout (see project memory: minimal padding, brand-color CTAs).
