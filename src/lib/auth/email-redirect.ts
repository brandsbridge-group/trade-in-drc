/**
 * The return address given to Supabase when it sends an auth e-mail
 * (confirm the account, reset the password).
 *
 * The site answers on several domains (tradeindrc.net / .com / .org, staging,
 * localhost) with ONE Supabase project, whose "Site URL" can only name one of
 * them. So the e-mail templates (scripts/build-email-templates.cjs) do not
 * build their link from the Site URL: they take THIS address — the domain the
 * person is on right now — and append `&token_hash=…&type=…` to it. Two rules
 * follow:
 *
 *   - it always points at /[locale]/callback, which verifies the token;
 *   - it always carries a query string, because the template appends with `&`.
 *
 * Supabase only keeps it if the domain is listed under Authentication → URL
 * Configuration → Redirect URLs; otherwise it falls back to the Site URL and
 * the template falls back with it.
 */
export type AuthEmailPurpose = "signup" | "recovery";

export function authEmailRedirect(
  origin: string,
  locale: string,
  purpose: AuthEmailPurpose,
  /** Where to land after signing up, already validated (same-origin path). */
  redirect?: string | null
): string {
  const base = `${origin.replace(/\/+$/, "")}/${locale}/callback`;
  if (purpose === "recovery") return `${base}?type=recovery`;
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : `${base}?via=email`;
}
