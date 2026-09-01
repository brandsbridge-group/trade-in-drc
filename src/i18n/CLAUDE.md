# i18n rules

- Supported locales today: `en`, `fr`, `tr`, `es`, `zh` (see `routing.ts`).
- Every user-facing string MUST live in `src/config/messages/{en,fr,tr,es,zh}.json`. No hardcoded English in JSX.
- Use `useTranslations("Namespace")` from `next-intl`, not raw imports of message JSON.
- Always use the locale-aware `Link`, `useRouter`, `usePathname`, `redirect` exported from `@/i18n/routing`. Do not import from `next/link` or `next/navigation` for navigation.
- For the current locale in a client component, use `useLocale()` from `next-intl` (NOT `usePathname().split("/")[1]` — the locale-aware `usePathname` strips it).
- When adding a new namespace, add it to ALL message files (`en.json`, `fr.json`, `tr.json`, `es.json`, `zh.json`) in the same PR.
- DB-stored content uses `_en` / `_fr` column pairs; read both, render based on `locale`.
