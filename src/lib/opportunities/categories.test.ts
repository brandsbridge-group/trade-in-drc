import { describe, it, expect } from "vitest";
import { OPPORTUNITY_CATEGORIES, isOpportunityCategory } from "./categories";

describe("opportunity categories", () => {
  it("exposes 8 canonical categories in order", () => {
    expect(OPPORTUNITY_CATEGORIES).toEqual([
      "tender",
      "ppp",
      "investment_call",
      "offer",
      "demand",
      "quotation",
      "partner_search",
      "project_launch",
    ]);
  });
  it("isOpportunityCategory accepts valid keys", () => {
    expect(isOpportunityCategory("tender")).toBe(true);
    expect(isOpportunityCategory("ppp")).toBe(true);
    expect(isOpportunityCategory("not_real")).toBe(false);
  });
});
