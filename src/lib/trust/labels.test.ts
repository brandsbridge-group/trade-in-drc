import { describe, it, expect } from "vitest";
import { tierLabel, tierTone } from "./labels";

describe("trust labels", () => {
  it("returns badge i18n key per tier", () => {
    expect(tierLabel("none")).toBe("badge.none");
    expect(tierLabel("basic")).toBe("badge.basic");
    expect(tierLabel("verified")).toBe("badge.verified");
    expect(tierLabel("premium")).toBe("badge.premium");
  });
  it("returns visual tone per tier", () => {
    expect(tierTone("verified")).toBe("emerald");
    expect(tierTone("premium")).toBe("indigo");
    expect(tierTone("basic")).toBe("slate");
    expect(tierTone("none")).toBe("muted");
  });
});
