import { describe, expect, it } from "vitest";
import { areCampaignUrlsValid, campaignTextForRecipient, EMPTY_CAMPAIGN, isCampaignReady, isLanguageReady, renderCampaignEmail } from "./campaign-email";

const body = "A message long enough to be sent to subscribers.";

describe("campaign readiness", () => {
  it("needs a subject and a message in at least one language", () => {
    const english = { ...EMPTY_CAMPAIGN, subject_en: "Trade news", body_en: body };
    expect(isLanguageReady(english, "en")).toBe(true);
    expect(isLanguageReady(english, "fr")).toBe(false);
    expect(isCampaignReady(english)).toBe(true);
    expect(isCampaignReady({ ...english, subject_fr: "Actualités", body_fr: body })).toBe(true);
    expect(isCampaignReady(EMPTY_CAMPAIGN)).toBe(false);
  });

  it("accepts short non-empty text in both languages", () => {
    const shortBilingual = {
      ...EMPTY_CAMPAIGN,
      subject_en: "Hi",
      body_en: "Hello",
      subject_fr: "Salut",
      body_fr: "Bonjour",
    };
    expect(isLanguageReady(shortBilingual, "en")).toBe(true);
    expect(isLanguageReady(shortBilingual, "fr")).toBe(true);
    expect(isCampaignReady(shortBilingual)).toBe(true);
  });

  it("uses the other complete language for recipients when their language is missing", () => {
    const english = { ...EMPTY_CAMPAIGN, subject_en: "Trade news", body_en: body };
    expect(campaignTextForRecipient(english, "fr")).toEqual({ subject: "Trade news", body });
    const bilingual = { ...english, subject_fr: "Actualités", body_fr: "Un message suffisamment long pour les abonnés." };
    expect(campaignTextForRecipient(bilingual, "fr")).toEqual({ subject: "Actualités", body: bilingual.body_fr });
  });

  it("does not count spaces as content", () => {
    expect(isLanguageReady({ ...EMPTY_CAMPAIGN, subject_en: "   ", body_en: " ".repeat(40) }, "en")).toBe(false);
  });

  it("accepts web links and HTTPS image URLs only", () => {
    expect(areCampaignUrlsValid({ ...EMPTY_CAMPAIGN, link_url: "https://example.org", photo_url: "https://example.org/photo.jpg" })).toBe(true);
    expect(areCampaignUrlsValid({ ...EMPTY_CAMPAIGN, link_url: "javascript:alert(1)" })).toBe(false);
    expect(areCampaignUrlsValid({ ...EMPTY_CAMPAIGN, photo_url: "http://example.org/photo.jpg" })).toBe(false);
  });

  it("keeps text readiness separate from invalid optional URLs", () => {
    const completeEnglish = {
      ...EMPTY_CAMPAIGN,
      subject_en: "Trade news",
      body_en: body,
      link_url: "not a URL",
    };
    expect(isCampaignReady(completeEnglish)).toBe(true);
    expect(areCampaignUrlsValid(completeEnglish)).toBe(false);
  });
});

describe("renderCampaignEmail", () => {
  const input = { language: "en" as const, subject: "Trade <news>", body: "First.\n\nSecond & last.", origin: "https://example.org", unsubscribeUrl: "https://example.org/u?token=t&locale=en" };

  it("escapes what the author typed and keeps paragraphs", () => {
    const { html, text } = renderCampaignEmail(input);
    expect(html).toContain("Trade &lt;news&gt;");
    expect(html).toContain("Second &amp; last.");
    expect(html.match(/<p style="margin:0 0 16px/g)).toHaveLength(2);
    expect(text).toContain("Unsubscribe: https://example.org/u?token=t&locale=en");
  });

  it("renders the same e-mail twice (a batch sent again must be identical)", () => {
    expect(renderCampaignEmail(input)).toEqual(renderCampaignEmail(input));
  });

  it("renders the optional photo and link in the email", () => {
    const { html, text } = renderCampaignEmail({
      ...input,
      linkUrl: "https://example.org/offer",
      photoUrl: "https://example.org/photo.jpg",
    });
    expect(html).toContain('src="https://example.org/photo.jpg"');
    expect(html).toContain('href="https://example.org/offer"');
    expect(html).toContain("Learn more");
    expect(text).toContain("https://example.org/photo.jpg");
    expect(text).toContain("Learn more: https://example.org/offer");
  });
});
