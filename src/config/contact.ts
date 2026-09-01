/**
 * Official Trade in DRC contact details — the single source of truth.
 *
 * These are proper nouns: an address, a phone number and a mailbox read the
 * same in every locale, so they live in config rather than the message
 * catalogs (same reasoning as COUNTRIES/DRC_PROVINCES in config/geo.ts).
 * Previously they were duplicated across five locale files, which is how a
 * placeholder phone number ("+243 XX XXX XXXX") and a stale address shipped
 * to production in all five languages at once.
 *
 * Confirmed by the customer 2026-07-28. Change them HERE and nowhere else.
 */
export const CONTACT = {
  email: "support@tradeindrc.com",
  /** Human-readable, spaced as the customer writes it. */
  phone: "+243 811 835 930",
  /** Address lines, rendered one per line. */
  addressLines: ["3, Avenue Mbemba", "Joli Parc, Ngaliema", "Kinshasa"],
} as const;

/** `tel:` href — digits and a leading + only, per RFC 3966. */
export const CONTACT_PHONE_HREF = `tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`;

/** `mailto:` href for the support mailbox. */
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT.email}`;

/** Address as a single string, newline separated (for `whitespace-pre-line`). */
export const CONTACT_ADDRESS = CONTACT.addressLines.join("\n");
