/**
 * Feature switches. One constant per feature, read by the screens (to show or
 * hide its entry points) AND by its server actions (to refuse it), so a hidden
 * feature is also a closed one.
 */

/**
 * Direct messaging between a buyer and a company: the dashboard inbox, the
 * "message the supplier" buttons of product and provider pages, and the
 * replies to a notice of the Opportunities board.
 *
 * Off by default: every contact goes through the team (quote request, contact
 * request, partner request — see `/console/requests`). Set
 * `NEXT_PUBLIC_MESSAGING_ENABLED=true` to bring it back; nothing is deleted
 * while it is off, existing conversations are only out of reach.
 *
 * `NEXT_PUBLIC_` because client components read it: the value is fixed at
 * build time, so changing it needs a rebuild.
 */
export const MESSAGING_ENABLED = process.env.NEXT_PUBLIC_MESSAGING_ENABLED === "true";
