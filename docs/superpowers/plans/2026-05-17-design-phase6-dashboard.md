# Design Phase 6 — Dashboard Skin Pass

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Apply the design-system look to every page under `/dashboard/*` — dense card style, `<PageHeader>` everywhere, replace any oversized padding / shadow-heavy cards with `border + p-3/4`. No new features, no data changes.

**Architecture:** The dashboard already has a sidebar shell (`AdminLayoutClient` is admin; dashboard has its own shell in `src/app/[locale]/dashboard/layout.tsx`). We only touch the *content* of each dashboard page so it adopts `<PageHeader>` + the design grammar.

**Pages in scope:** read recon first, but the candidates per S5/S6 work include:
- `/dashboard` (overview)
- `/dashboard/products` + `/dashboard/products/[id]`
- `/dashboard/rfq` (legacy RFQ list)
- `/dashboard/opportunities` + new + [id] (S5 — already partly designed; tighten)
- `/dashboard/companies` + [id]
- `/dashboard/inbox` + [id]
- `/dashboard/analytics`
- `/dashboard/settings` + `/dashboard/settings/account` (already P5'd)

**No commits per task. Single commit at end.**

---

## Task 1: Recon

Read-only. List every page under `src/app/[locale]/dashboard/` and identify which still use the old card-with-shadow / large-padding style. Output the "to-skin" list. Pages already touched in P5 (settings/account) and S5 (opportunities/* — already used new patterns) can be skipped if they look clean.

## Task 2: Apply `<PageHeader>` + tighten every dashboard page

For each page in the recon "to-skin" list:
- Replace inline `<h1 className="text-3xl …">…</h1>` with `<PageHeader title=… subtitle=… />`.
- Container becomes `<div className="max-w-6xl">` or follow what dashboard layout expects.
- All cards inside become `bg-card border rounded-md p-3` (or `p-4` for forms). Drop `shadow-*`. Drop `rounded-2xl`.
- Tables tighten: `text-sm`, row padding `py-2`.

Per page, preserve all data-fetching and form behavior.

## Task 3: Verify + ship-wreck + commit

- `npx vitest run` — 24 tests.
- `npm run build` — clean.
- `npx eslint --quiet 'src/app/[locale]/dashboard/'`.
- Orchestrator commits.
