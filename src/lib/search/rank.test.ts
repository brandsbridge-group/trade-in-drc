import { describe, it, expect } from "vitest";
import { groupResults, TYPE_ORDER } from "./rank";

describe("rank.groupResults", () => {
  it("groups by entity_type and sorts by rank desc within group", () => {
    const r = groupResults([
      { entity_type: "company", entity_id: "1", title: "A", snippet: "", href: "/a", rank: 0.2, verification_tier: null },
      { entity_type: "company", entity_id: "2", title: "B", snippet: "", href: "/b", rank: 0.9, verification_tier: "verified" },
      { entity_type: "report",  entity_id: "3", title: "C", snippet: "", href: "/c", rank: 0.5, verification_tier: null },
    ]);
    expect(r.company.map(x => x.entity_id)).toEqual(["2", "1"]);
    expect(r.report.map(x => x.entity_id)).toEqual(["3"]);
    expect(r.product).toEqual([]);
  });
  it("TYPE_ORDER lists 6 types", () => {
    expect(TYPE_ORDER.length).toBe(6);
  });
});
