/**
 * Newsletter link tokens.
 *
 * Unsubscribe: `<subscriber id>.<HMAC-SHA256 signature>`. Nothing is stored and
 * nothing expires, so the link of ANY e-mail ever sent keeps working — a
 * stored token that each campaign replaced used to break every earlier link.
 *
 * The signing key is `NEWSLETTER_TOKEN_SECRET`, or the service-role key when
 * it is not set. Changing the key invalidates every link already sent.
 *
 * Server-only module (it reads secrets) — never import it into a client component.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const SIGNED_TOKEN = new RegExp(`^(${UUID})\\.([a-f0-9]{64})$`);
/** Random 256-bit token, stored hashed: confirmation links, and unsubscribe links sent before 00069. */
const RANDOM_TOKEN = /^[a-f0-9]{64}$/;

function signingKey(): string {
  const key = process.env.NEWSLETTER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("No key to sign newsletter links (NEWSLETTER_TOKEN_SECRET).");
  return key;
}

function sign(subscriberId: string): string {
  return createHmac("sha256", signingKey()).update(`newsletter-unsubscribe:v1:${subscriberId}`).digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isRandomToken(token: string): boolean {
  return RANDOM_TOKEN.test(token);
}

export function createUnsubscribeToken(subscriberId: string): string {
  return `${subscriberId}.${sign(subscriberId)}`;
}

/** The subscriber a signed unsubscribe token belongs to, or null when it is not one of ours. */
export function verifyUnsubscribeToken(token: string): string | null {
  const match = SIGNED_TOKEN.exec(token);
  if (!match) return null;
  const [, subscriberId, signature] = match;
  const expected = Buffer.from(sign(subscriberId), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given) ? subscriberId : null;
}

/** True for anything the unsubscribe route can act on (signed, or legacy random). */
export function isUnsubscribeToken(token: string): boolean {
  return SIGNED_TOKEN.test(token) || RANDOM_TOKEN.test(token);
}

export function unsubscribeUrl(origin: string, subscriberId: string, locale: "en" | "fr"): string {
  return `${origin}/api/newsletter/unsubscribe?token=${createUnsubscribeToken(subscriberId)}&locale=${locale}`;
}
