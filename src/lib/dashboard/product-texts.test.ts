import { describe, expect, it } from "vitest";
import { isLangComplete, resolveProductTexts, type ProductTexts } from "./product-texts";

const empty: ProductTexts = { name_fr: "", name_en: "", description_fr: "", description_en: "" };

describe("resolveProductTexts", () => {
  it("accepts a product written in one language and mirrors it into the other", () => {
    const result = resolveProductTexts({ ...empty, name_fr: " Café arabica ", description_fr: "Lavé et séché au soleil." });
    expect(result).toEqual({
      ok: true,
      texts: {
        name_fr: "Café arabica",
        name_en: "Café arabica",
        description_fr: "Lavé et séché au soleil.",
        description_en: "Lavé et séché au soleil.",
      },
    });
  });

  it("keeps each language's own text when both are written", () => {
    const result = resolveProductTexts({
      name_fr: "Café arabica",
      name_en: "Arabica coffee",
      description_fr: "Lavé et séché au soleil.",
      description_en: "Washed and sun-dried.",
    });
    expect(result.ok && result.texts.name_en).toBe("Arabica coffee");
    expect(result.ok && result.texts.description_fr).toBe("Lavé et séché au soleil.");
  });

  it("fills a half-translated language field by field", () => {
    const result = resolveProductTexts({ name_fr: "Café arabica", name_en: "Arabica coffee", description_fr: "Lavé et séché au soleil.", description_en: "" });
    expect(result.ok && result.texts.description_en).toBe("Lavé et séché au soleil.");
  });

  it("reports what is missing when no language has a usable name or description", () => {
    expect(resolveProductTexts(empty)).toEqual({ ok: false, errors: ["name", "description"] });
    expect(resolveProductTexts({ ...empty, name_en: "Coffee", description_en: "short" })).toEqual({ ok: false, errors: ["description"] });
  });
});

describe("isLangComplete", () => {
  it("needs both the name and the description in that language", () => {
    const texts = { ...empty, name_fr: "Café arabica", description_fr: "Lavé et séché au soleil.", name_en: "Coffee" };
    expect(isLangComplete(texts, "fr")).toBe(true);
    expect(isLangComplete(texts, "en")).toBe(false);
  });
});
