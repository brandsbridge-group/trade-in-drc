/** Schemes we are willing to put in an outbound href. */
const SAFE_SCHEME = /^https?:\/\//i;
/** Anything with a scheme-ish prefix, so `javascript:` etc. can be rejected. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Turn a user-entered website into a safe absolute href.
 *
 * People type `www.example.com`, not `https://www.example.com`. Rendered raw in
 * an `href` that becomes a RELATIVE link (`/en/companies/www.example.com`), so
 * the link silently breaks — assume https when no scheme is given.
 *
 * Returns null for empty input or a non-http(s) scheme (e.g. `javascript:`),
 * so callers can skip rendering the link entirely.
 */
export function toExternalHref(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (SAFE_SCHEME.test(raw)) return raw;
  // Reject any other explicit scheme rather than silently prefixing it.
  if (HAS_SCHEME.test(raw)) return null;
  return `https://${raw}`;
}

/** Display form of a website: no scheme, no trailing slash. */
export function toDisplayHost(value: string | null | undefined): string {
  return (value ?? "").trim().replace(SAFE_SCHEME, "").replace(/\/+$/, "");
}
