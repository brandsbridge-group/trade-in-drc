/**
 * What a campaign is made of and how it renders. Pure and shared: the console
 * previews a draft with the very function the sender uses, and validates it
 * with the same limits the server enforces.
 */

import { renderEmailLayout, type EmailLocale, type RenderedEmail } from "@/lib/email/layout";
import type { Database } from "@/lib/supabase/types";

export type NewsletterCampaign = Database["public"]["Tables"]["newsletter_campaigns"]["Row"];

export const CAMPAIGN_LANGUAGES = ["en", "fr"] as const satisfies readonly EmailLocale[];
export type CampaignLanguage = (typeof CAMPAIGN_LANGUAGES)[number];

export const CAMPAIGN_LIMITS = {
  subjectMin: 3,
  subjectMax: 180,
  bodyMin: 20,
  bodyMax: 8000,
} as const;

export interface CampaignContent {
  subject_en: string;
  subject_fr: string;
  body_en: string;
  body_fr: string;
}

export const EMPTY_CAMPAIGN: CampaignContent = { subject_en: "", subject_fr: "", body_en: "", body_fr: "" };

export function campaignText(content: CampaignContent, language: CampaignLanguage) {
  return language === "fr"
    ? { subject: content.subject_fr, body: content.body_fr }
    : { subject: content.subject_en, body: content.body_en };
}

/** Whether one language of a campaign can be sent as it is. */
export function isLanguageReady(content: CampaignContent, language: CampaignLanguage): boolean {
  const { subject, body } = campaignText(content, language);
  const s = subject.trim().length;
  const b = body.trim().length;
  return (
    s >= CAMPAIGN_LIMITS.subjectMin &&
    s <= CAMPAIGN_LIMITS.subjectMax &&
    b >= CAMPAIGN_LIMITS.bodyMin &&
    b <= CAMPAIGN_LIMITS.bodyMax
  );
}

export function isCampaignReady(content: CampaignContent): boolean {
  return CAMPAIGN_LANGUAGES.every((language) => isLanguageReady(content, language));
}

/** One language of a campaign as the e-mail a subscriber receives. */
export function renderCampaignEmail(input: {
  language: CampaignLanguage;
  subject: string;
  body: string;
  /** Logo origin; "" for the in-page preview. */
  origin: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  return renderEmailLayout({
    locale: input.language,
    origin: input.origin,
    preheader: input.subject,
    heading: input.subject,
    paragraphs: [input.body],
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
