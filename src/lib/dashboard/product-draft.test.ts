import { describe, it, expect } from "vitest";
import { isEmptySpecs, parseDraftSpecs, productDraftKey, restoreDraftSpecs } from "./product-draft";
import type { SpecField } from "@/lib/products/specs";

const field = (key: string): SpecField => ({
  key,
  label_en: key,
  label_fr: key,
  field_type: "text",
  unit: null,
  options: [],
  required: false,
  sort_order: 0,
});

describe("productDraftKey", () => {
  it("is per product, or per company while the product does not exist", () => {
    expect(productDraftKey("co1", "p1")).toBe("tidrc:product:draft:v1:p1");
    expect(productDraftKey("co1")).toBe("tidrc:product:draft:v1:new:co1");
  });
});

describe("isEmptySpecs", () => {
  it("ignores blank values and blank free lines", () => {
    expect(isEmptySpecs({ values: { grade: "  " }, custom: [{ id: "a", label: "", value: " " }] })).toBe(true);
    expect(isEmptySpecs({ values: {}, custom: [{ id: "a", label: "Origin", value: "" }] })).toBe(false);
    expect(isEmptySpecs({ values: { grade: "A" }, custom: [] })).toBe(false);
  });
});

describe("parseDraftSpecs", () => {
  it("keeps strings only and gives free lines fresh ids", () => {
    expect(
      parseDraftSpecs({
        values: { grade: "A", weight: 12, nested: { a: 1 } },
        custom: [{ id: "row-1", label: "Origin", value: "Kivu" }, { label: 3, value: "x" }, null, "oops"],
      })
    ).toEqual({ values: { grade: "A" }, custom: [{ id: "draft-0", label: "Origin", value: "Kivu" }] });
  });

  it("returns null when nothing usable is stored", () => {
    expect(parseDraftSpecs(null)).toBeNull();
    expect(parseDraftSpecs("oops")).toBeNull();
    expect(parseDraftSpecs([])).toBeNull();
    expect(parseDraftSpecs({ values: { grade: "" }, custom: [] })).toBeNull();
  });
});

describe("restoreDraftSpecs", () => {
  it("turns a value whose field left the template into a free line", () => {
    const restored = restoreDraftSpecs(
      { values: { grade: "A", lead_time: "3 weeks", empty: " " }, custom: [{ id: "draft-0", label: "Origin", value: "Kivu" }] },
      [field("grade")]
    );
    expect(restored.values).toEqual({ grade: "A" });
    expect(restored.custom).toEqual([
      { id: "draft-moved-lead_time", label: "Lead time", value: "3 weeks" },
      { id: "draft-0", label: "Origin", value: "Kivu" },
    ]);
  });
});
