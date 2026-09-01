# Design-system primitives

This folder holds the composed primitives used by the page rewrites driven by `DESIGN.md`. They sit on top of `src/components/ui/` (shadcn). Do not put shadcn primitives here.

Rules every primitive obeys:
- White background. `--primary` only on CTAs, links, active tabs, banners.
- Padding scale 2/3/4 (8/12/16px). Outer page wrapper may use `py-6`.
- Radius: `rounded-2xl` on big outer containers, `rounded-xl` on standard cards, `rounded-md` on inputs/tab buttons. `rounded-full` on chips/pills/CTA buttons. No `rounded-3xl`.
- No `shadow-*`. Borders 1 px `border` token only.
- All user-visible strings via next-intl (`Design.*` namespace).
- Server Components by default; mark `"use client"` only when needed.
- Named exports only. Re-export via `index.ts`.

When a page needs a new primitive, add it here, document it in `DESIGN.md` §2, then use it. Don't inline new patterns in pages.

Motion: every primitive in this folder must follow `docs/MOTION.md` (Emil primary, Jakub secondary, Jhey selective). Hover transitions use Tailwind's default `transition` (150 ms). Page-level enter animations on marketing surfaces use the Jakub recipe (`initial={{ opacity: 0, translateY: 8, filter: "blur(4px)" }}` with `spring 0.45 bounce 0`). Always respect `prefers-reduced-motion` (a global Tailwind rule in `globals.css` covers it).
