# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradeInDRC is the official bilingual (English/French) online trade portal for the Democratic Republic of Congo. Built with Next.js 16, it connects international buyers with Congolese exporters through company profiles, product listings, trade opportunities, and investment resources.

## Master roadmap

The PDF spec at `docs/DASHBOARD.pdf` defines 14 modules. The full decomposition, sequencing (S1→S9), and per-slice scope live in `docs/superpowers/specs/2026-05-17-master-roadmap-design.md`. Read it before starting work on any new module. Each slice gets its own implementation plan via `superpowers:writing-plans`.

## Motion principles (mandatory)

Every animation in this codebase MUST follow `docs/MOTION.md`. Confirmed weighting for this project (2026-05-18): **Emil Kowalski primary** (restraint, ≤180 ms hovers, ≤300 ms enters), **Jakub Krehel secondary** (production polish recipe for marketing-surface mounts), **Jhey Tompkins selective** (delighters only). Before adding any new animation:

1. Invoke the `design-motion-principles` skill to refresh your motion knowledge.
2. Read `docs/MOTION.md` for the project's recipes, forbidden patterns, and a11y rules.
3. Use one of the documented recipes; if you need a new one, add it to MOTION.md first.
4. Always respect `prefers-reduced-motion` (global rule in `globals.css` covers Tailwind; per-component for raw framer-motion).
5. Hover ≤ 200 ms, mount ≤ 300 ms, marketing-surface enter ≤ 500 ms. Anything longer needs an inline comment justifying it.

The golden rule: *"The best animation is that which goes unnoticed."*

## Folder-scoped CLAUDE.md policy (lean context)

**Rule:** Put area-specific rules in a CLAUDE.md inside the relevant folder, not in this root file. Claude Code auto-loads nested CLAUDE.md files when working under that path, which keeps the root lean and irrelevant rules out of context.

Folder CLAUDE.md files maintained in this repo:

| Folder | Concerns |
|---|---|
| `src/app/[locale]/admin/` | Admin route guard, RLS reminders, never expose service-role key client-side |
| `src/app/[locale]/dashboard/` | Auth state assumptions, Zustand store conventions |
| `src/lib/supabase/` | Which client variant to use where (browser/server/middleware/admin) |
| `supabase/migrations/` | Migration numbering, RLS-by-default, naming, bilingual columns |
| `src/i18n/` | How to add a message key, file structure, locale fallbacks, deferred locales (TR/ZH/ES) |
| `src/components/ui/` | shadcn rules, no overrides, prefer composition |

When you introduce a new pattern that's specific to one area, **add it to that folder's CLAUDE.md** — do not append to this root file. Root CLAUDE.md stays an index + global conventions only.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (next core-web-vitals + typescript)
```

## Supabase & secrets policy (project rule)

- **Always push Supabase migrations to prod.** After writing any new file in `supabase/migrations/`, apply it immediately — do not leave migrations pending. Use `supabase db push` (preferred; the project is already linked) or the Supabase MCP `apply_migration`.
- **`src/lib/supabase/types.ts` is hand-maintained — do NOT run `supabase gen types`.** That command overwrites the file and drops the hand-authored type aliases at the top (`VerificationTier`, `BusinessRequestStatus`, `PremiumPlan`, …). When a migration changes the schema, edit the affected `Row`/`Insert`/`Update` fields in `types.ts` by hand to match.
- **Reading `.env` is allowed.** You may read `.env` in this project to obtain `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and other config needed to run migrations, seed scripts, or admin-client operations. Never print secret values back to the chat, never commit `.env`, and never send secrets to any external service.

## Architecture

### Internationalization (next-intl)

All routes live under `src/app/[locale]/`. Supported locales: `en` (default), `fr`.

- **Routing config**: `src/i18n/routing.ts` — exports locale-aware `Link`, `useRouter`, `usePathname`, `redirect`
- **Message loading**: `src/i18n/request.ts` — dynamically imports from `src/config/messages/{locale}.json`
- **Middleware**: `src/middleware.ts` — next-intl middleware, matcher pattern `/(fr|en|tr)/:path*`
- **Always use** `import { Link, useRouter, usePathname } from '@/i18n/routing'` instead of Next.js navigation APIs directly. This ensures locale prefixing works correctly.

### Supabase (4 client variants)

- **Browser client** (`src/lib/supabase/client.ts`): `createBrowserClient()` — for client components. Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server client** (`src/lib/supabase/server.ts`): `createServerClient()` — for Server Components and Route Handlers. Reads/writes cookies via Next.js `cookies()`.
- **Middleware client** (`src/lib/supabase/middleware.ts`): `createMiddlewareClient()` — used in `src/middleware.ts` to refresh session cookies on every request.
- **Admin client** (`src/lib/supabase/admin.ts`): `createClient()` with `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS for privileged server-only operations.

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Database schema**: migrations live in `supabase/migrations/`. Key tables: `profiles`, `companies`, `sectors`, `categories`, `opportunities`. Row-Level Security (RLS) is enabled on all tables.

### Auth

`src/lib/auth/auth-provider.tsx` provides `AuthProvider` context and `useAuth()` hook. Uses Supabase Auth with `onAuthStateChange` listener via the browser client. Auth modal: `src/components/auth/user-auth-modal.tsx`.

### UI Layer

- **shadcn/ui** (new-york style) with Radix primitives — components in `src/components/ui/`
- **Tailwind CSS v4** with `tw-animate-css` for animations
- **Framer Motion** for page transitions and micro-interactions
- **Lucide React** for icons
- **Sonner** for toast notifications
- Add new shadcn components via: `npx shadcn@latest add <component>`

### Provider Hierarchy (layout.tsx)

`NextIntlClientProvider` → `AuthProvider` → `SearchProvider` → page content. All pages get Navbar + Footer + CookieConsent + Toaster.

### Key Patterns

- **Navigation config**: `src/config/navigation.ts` — centralized `NAVIGATION_CONFIG` array with nested mega-menu items
- **Command palette / Search**: `src/lib/search/search-context.tsx` (Cmd+K) + `src/lib/search/search-registry.ts` for searchable items
- **Site config**: `src/config/site.ts` — name, description, links
- **Path alias**: `@/*` maps to `./src/*`

### Page Structure

- **Public pages**: homepage, about/[slug], products, companies/[id], opportunities, news, events, contact, FAQ, blog, sectors, legal pages (terms, privacy, cookies)
- **Dashboard** (`/dashboard`): authenticated user area — company management, inbox, analytics
- **Admin** (`/admin`): sidebar layout with verifications, companies, users, taxonomy, analytics, settings

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
