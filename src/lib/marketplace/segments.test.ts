import { describe, it, expect } from "vitest";
import { SEGMENT_KEYS, isSegmentKey, segmentSortIndex } from "./segments";

describe("segments", () => {
  // "investors" was added as the ninth marketplace category by migration 00034
  // (customer design: marketplace-drc-business.ai), and must stay last so the
  // stored sort_order keeps matching this list.
  it("exposes exactly 9 canonical segments in roadmap order", () => {
    expect(SEGMENT_KEYS).toEqual([
      "manufacturer","importer","exporter","finance",
      "logistics","government","public_corp","facilitation","investors",
    ]);
  });
  it("isSegmentKey accepts valid keys and rejects others", () => {
    expect(isSegmentKey("manufacturer")).toBe(true);
    expect(isSegmentKey("nonsense")).toBe(false);
  });
  it("segmentSortIndex returns position in canonical list", () => {
    expect(segmentSortIndex("manufacturer")).toBe(0);
    expect(segmentSortIndex("facilitation")).toBe(7);
    expect(segmentSortIndex("investors")).toBe(8);
  });
});
