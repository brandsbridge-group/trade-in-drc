import { describe, it, expect } from "vitest";
import {
  canViewPublicProfile,
  registerFirstOrAnother,
  resolveSectorLabel,
} from "./company-display";

describe("registerFirstOrAnother (P1-1)", () => {
  it("returns registerFirst when the owner has no companies", () => {
    expect(registerFirstOrAnother(0)).toBe("registerFirst");
  });

  it("returns registerAnother when the owner already has at least one company", () => {
    expect(registerFirstOrAnother(1)).toBe("registerAnother");
    expect(registerFirstOrAnother(5)).toBe("registerAnother");
  });
});

describe("canViewPublicProfile (P1-3)", () => {
  it("allows the profile link only for verified companies", () => {
    expect(canViewPublicProfile("verified")).toBe(true);
  });

  it("blocks the profile link for pending, rejected, or any other status", () => {
    expect(canViewPublicProfile("pending")).toBe(false);
    expect(canViewPublicProfile("rejected")).toBe(false);
    expect(canViewPublicProfile("more_info_requested")).toBe(false);
  });
});

describe("resolveSectorLabel (P1-7)", () => {
  it("resolves the label for the active locale from a single-object embed", () => {
    const sectors = { name_en: "Agriculture", name_fr: "Agriculture (FR)" };
    expect(resolveSectorLabel(sectors, "fr")).toBe("Agriculture (FR)");
    expect(resolveSectorLabel(sectors, "en")).toBe("Agriculture");
  });

  it("falls back to English (then French) when the active locale has no column", () => {
    // TR/ZH/ES have no dedicated sectors.name_<locale> column (see types.ts:143-166).
    // pickLocalized's CONTENT_FALLBACK_ORDER is [en, fr], so en wins here.
    const sectors = { name_en: "Mining", name_fr: "Exploitation minière" };
    expect(resolveSectorLabel(sectors, "tr")).toBe("Mining");
  });

  it("falls back to French when only the French column is populated", () => {
    const sectors = { name_en: "", name_fr: "Exploitation minière" };
    expect(resolveSectorLabel(sectors, "tr")).toBe("Exploitation minière");
  });

  it("normalizes a one-element array embed the same as a single object", () => {
    const sectors = [{ name_en: "Textiles", name_fr: "Textiles (FR)" }];
    expect(resolveSectorLabel(sectors, "en")).toBe("Textiles");
  });

  it("returns an empty string when the company has no sector_id set", () => {
    expect(resolveSectorLabel(null, "en")).toBe("");
    expect(resolveSectorLabel(undefined, "en")).toBe("");
    expect(resolveSectorLabel([], "en")).toBe("");
  });
});
