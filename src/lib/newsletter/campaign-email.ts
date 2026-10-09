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
  subjectMin: 1,
  subjectMax: 180,
  bodyMin: 1,
  bodyMax: 8000,
} as const;

export interface CampaignContent {
  subject_en: string;
  subject_fr: string;
  body_en: string;
  body_fr: string;
  link_url: string;
  photo_url: string;
}

export const EMPTY_CAMPAIGN: CampaignContent = {
  subject_en: "",
  subject_fr: "",
  body_en: "",
  body_fr: "",
  link_url: "",
  photo_url: "",
};

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function areCampaignUrlsValid(content: CampaignContent): boolean {
  return (!content.link_url || isHttpUrl(content.link_url)) && (!content.photo_url || isHttpsUrl(content.photo_url));
}

export function campaignText(content: CampaignContent, language: CampaignLanguage) {
  return language === "fr"
    ? { subject: content.subject_fr, body: content.body_fr }
    : { subject: content.subject_en, body: content.body_en };
}

/** Use a complete native version when available, otherwise the complete other-language version. */
export function campaignTextForRecipient(content: CampaignContent, language: CampaignLanguage) {
  if (isLanguageReady(content, language)) return campaignText(content, language);
  const fallbackLanguage = language === "en" ? "fr" : "en";
  return campaignText(content, fallbackLanguage);
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
  return CAMPAIGN_LANGUAGES.some((language) => isLanguageReady(content, language));
}

/** One language of a campaign as the e-mail a subscriber receives. */
export function renderCampaignEmail(input: {
  language: CampaignLanguage;
  subject: string;
  body: string;
    linkUrl?: string;
    photoUrl?: string;
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
    image: input.photoUrl && isHttpsUrl(input.photoUrl)
      ? { src: input.photoUrl, href: input.linkUrl && isHttpUrl(input.linkUrl) ? input.linkUrl : undefined, alt: input.subject }
      : undefined,
    cta: input.linkUrl && isHttpUrl(input.linkUrl)
      ? { label: input.language === "fr" ? "En savoir plus" : "Learn more", href: input.linkUrl }
      : undefined,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
