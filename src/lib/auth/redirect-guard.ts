import { ROUTES } from "@/constants/routes";

/**
 * Open-redirect guard shared by every post-login redirect target: the OAuth
 * `/callback` route (`src/app/[locale]/(auth)/callback/route.ts`), the
 * login and signup forms (`src/components/auth/`), and the signed-in bounce
 * on the /signup page.
 *
 * Only same-origin paths are allowed. An absolute URL to another origin, a
 * protocol-relative URL (`//evil.com`), or anything that fails to parse falls
 * back to `fallback`. A same-origin path missing the locale prefix is
 * normalised by prepending it — this lets callers pass a bare, locale-less
 * path such as `/register-company`.
 */
export function resolveSafeRedirect(
  redirect: string | null | undefined,
  locale: string,
  origin: string,
  fallback: string
): string {
  if (!redirect) return fallback;

  try {
    const candidate = new URL(redirect, origin);
    if (candidate.origin !== origin) return fallback;

    const path = candidate.pathname + candidate.search;
    return path.startsWith(`/${locale}/`) || path === `/${locale}`
      ? path
      : `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return fallback;
  }
}

/**
 * P2-7: every successful auth path (login, signup's email-confirmation
 * round-trip, OAuth callback) lands on the dashboard overview (`/dashboard`)
 * by default — the one landing spot every call site agrees on, so it lives
 * here once. The overview adapts: a brand-new account without a company sees
 * the guided onboarding there, an established company its "À faire" list.
 * An explicit `?redirect=` target (validated by `resolveSafeRedirect`) still
 * always wins over this default. The ADMIN branch bypasses this helper
 * entirely and always goes to `/console` — that decision is made by the caller
 * before this function is ever reached.
 */
export function resolvePostAuthRedirect(
  redirect: string | null | undefined,
  locale: string,
  origin: string
): string {
  return resolveSafeRedirect(redirect, locale, origin, `/${locale}${ROUTES.DASHBOARD}`);
}
