/**
 * Paths and button styles of the newsletter console.
 *
 * Deliberately NOT a "use client" module: server pages import these values. A
 * constant imported by a server component from a "use client" file is not the
 * value but a client reference — passing one as a link `href` crashes the page
 * (`startsWith is not a function`).
 */

import { ROUTES } from "@/constants/routes";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";

export const NAVY_PILL =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy/90 disabled:pointer-events-none disabled:opacity-60";
export const GHOST_PILL =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-60";

export const NEW_CAMPAIGN_PATH = `${ROUTES.CONSOLE_NEWSLETTER}/new`;

export function campaignPath(id: string): string {
  return `${ROUTES.CONSOLE_NEWSLETTER}/${id}`;
}

/** The subject in the reader's language, falling back to the other one for an unfinished draft. */
export function campaignSubject(campaign: Pick<NewsletterCampaign, "subject_en" | "subject_fr">, locale: string): string {
  const [first, second] = locale === "fr" ? [campaign.subject_fr, campaign.subject_en] : [campaign.subject_en, campaign.subject_fr];
  return first || second;
}
