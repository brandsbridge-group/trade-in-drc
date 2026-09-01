/**
 * CAPTCHA verification — pluggable provider, defaults to Cloudflare Turnstile.
 *
 * Anti-scraping for contact/message sends (Requirements module 6).
 *
 * Configuration via environment:
 *   - CAPTCHA_SECRET_KEY        (server-only; used to verify tokens)
 *   - NEXT_PUBLIC_CAPTCHA_SITE_KEY (client; rendered by the widget)
 *
 * If CAPTCHA_SECRET_KEY is unset, verification is skipped gracefully so local
 * development works without provisioning a provider. The client widget reads
 * NEXT_PUBLIC_CAPTCHA_SITE_KEY and only renders when present.
 *
 * Server-only module — never import into a client component.
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface CaptchaVerificationResult {
  /** True when the token passed, or when CAPTCHA is not configured (dev). */
  ok: boolean;
  /** A machine-readable failure code when ok is false. */
  errorCode?: "missing_token" | "verification_failed" | "provider_error";
}

/** True when a secret key is configured and verification should be enforced. */
export function isCaptchaConfigured(): boolean {
  return Boolean(process.env.CAPTCHA_SECRET_KEY);
}

/**
 * Verifies a CAPTCHA token against the configured provider.
 *
 * @param token   The client-supplied CAPTCHA response token.
 * @param remoteIp Optional caller IP for provider-side scoring.
 */
export async function verifyCaptchaToken(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<CaptchaVerificationResult> {
  const secretKey = process.env.CAPTCHA_SECRET_KEY;

  // Not configured → skip gracefully (dev / pre-provisioning).
  if (!secretKey) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, errorCode: "missing_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, errorCode: "provider_error" };
    }

    const data = (await response.json()) as { success?: boolean };
    return data.success === true
      ? { ok: true }
      : { ok: false, errorCode: "verification_failed" };
  } catch {
    // Network/provider failure — treat as a verification failure, not a crash.
    return { ok: false, errorCode: "provider_error" };
  }
}
