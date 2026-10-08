/**
 * The public address of the site, for links that leave it (e-mails).
 *
 * One source: `NEXT_PUBLIC_SITE_URL`. Outside production a missing value
 * falls back to the local dev server. In production there is NO fallback: a
 * guessed address would put dead confirmation / unsubscribe links in e-mails
 * that cannot be recalled, so the caller gets an error instead and nothing is
 * sent.
 */

const DEV_ORIGIN = "http://localhost:3000";

/** The configured origin without trailing slash, or null when it is missing in production. */
export function configuredSiteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEV_ORIGIN;
}

/** The site origin; throws when production has no `NEXT_PUBLIC_SITE_URL`. */
export function siteOrigin(): string {
  const origin = configuredSiteOrigin();
  if (!origin) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set: refusing to build links for an e-mail.");
  }
  return origin;
}
