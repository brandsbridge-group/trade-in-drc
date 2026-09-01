# Supabase client variants

Pick the right client for the surface — mixing them up causes RLS bypass or broken cookies.

| File | Export | When to use |
|---|---|---|
| `client.ts` | `createClient` | Client Components and hooks. Reads `NEXT_PUBLIC_*` envs. |
| `server.ts` | `createServerSupabaseClient` | Server Components, Route Handlers, Server Actions. Hydrates cookies via Next.js `cookies()`. Async. |
| `middleware.ts` | `createMiddlewareClient` | ONLY inside `src/middleware.ts` — refreshes the session cookie. |
| `admin.ts` | service-role client | Server-only privileged ops. NEVER import from any file that ships to the browser. |

If unsure, default to `createServerSupabaseClient()`.
