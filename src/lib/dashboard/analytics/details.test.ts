import { describe, expect, it } from "vitest";
import { funnelSteps, sumSeries, weekdayTotals } from "./details";

describe("weekdayTotals", () => {
  it("puts each day in its weekday, Monday first", () => {
    // 2026-09-07 is a Monday.
    expect(weekdayTotals([1, 2, 3, 4, 5, 6, 7], "2026-09-07T00:00:00+00:00")).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("adds the same weekday across weeks", () => {
    // Starts on a Sunday (2026-09-06): Sunday is the last slot.
    const totals = weekdayTotals([10, 1, 0, 0, 0, 0, 0, 5], "2026-09-06T00:00:00+00:00");
    expect(totals).toEqual([1, 0, 0, 0, 0, 0, 15]);
  });

  it("returns seven zeros for an empty series", () => {
    expect(weekdayTotals([], "2026-09-06T00:00:00+00:00")).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("funnelSteps", () => {
  it("gives each step its share of the previous one", () => {
    const steps = funnelSteps([
      { key: "seen", value: 200 },
      { key: "viewed", value: 50 },
      { key: "contacted", value: 5 },
    ]);
    expect(steps.map((s) => s.ofPrevious)).toEqual([null, 0.25, 0.1]);
  });

  it("has no share when the previous step is empty", () => {
    const steps = funnelSteps([
      { key: "seen", value: 0 },
      { key: "viewed", value: 3 },
    ]);
    expect(steps[1].ofPrevious).toBeNull();
  });
});

describe("sumSeries", () => {
  it("adds day by day", () => {
    expect(sumSeries([1, 2, 3], [4, 0, 1])).toEqual([5, 2, 4]);
  });
});
