import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and kebabs simple text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("collapses runs of punctuation", () => {
    expect(slugify("Hello,   World!!")).toBe("hello-world");
  });
  it("strips diacritics (French)", () => {
    expect(slugify("Côte d'Ivoire — économie")).toBe("cote-d-ivoire-economie");
  });
  it("returns empty string for all-punctuation input", () => {
    expect(slugify("!!!---???")).toBe("");
  });
  it("trims leading and trailing dashes", () => {
    expect(slugify("  -hello-")).toBe("hello");
  });
});
