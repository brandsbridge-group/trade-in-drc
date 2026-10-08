import { describe, expect, it } from "vitest";
import { EMPTY_CAMPAIGN, isCampaignReady, isLanguageReady, renderCampaignEmail } from "./campaign-email";

const body = "A message long enough to be sent to subscribers.";

describe("campaign readiness", () => {
  it("needs a subject and a message in both languages", () => {
    const english = { ...EMPTY_CAMPAIGN, subject_en: "Trade news", body_en: body };
    expect(isLanguageReady(english, "en")).toBe(true);
    expect(isLanguageReady(english, "fr")).toBe(false);
    expect(isCampaignReady(english)).toBe(false);
    expect(isCampaignReady({ ...english, subject_fr: "Actualités", body_fr: body })).toBe(true);
  });

  it("does not count spaces as content", () => {
    expect(isLanguageReady({ ...EMPTY_CAMPAIGN, subject_en: "   ", body_en: " ".repeat(40) }, "en")).toBe(false);
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
});
