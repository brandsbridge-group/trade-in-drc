import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

import { alreadyViewed } from "./track-view";
import { viewDayKey, viewDayStart } from "./view-day";

describe("view day (Kinshasa calendar day)", () => {
  it("starts at midnight Kinshasa time, which is 23:00 UTC the day before", () => {
    expect(viewDayKey(new Date("2026-10-02T22:59:59Z"))).toBe("2026-10-02");
    expect(viewDayKey(new Date("2026-10-02T23:00:00Z"))).toBe("2026-10-03");
    expect(viewDayStart(new Date("2026-10-03T10:00:00Z"))).toBe("2026-10-02T23:00:00.000Z");
  });
});

describe("alreadyViewed", () => {
  it("lets the first view through and blocks the immediate repeat (Strict Mode double effect)", () => {
    const seen = new Map<string, string>();
    expect(alreadyViewed("company:c1", new Date("2026-10-02T10:00:00.000Z"), seen)).toBe(false);
    expect(alreadyViewed("company:c1", new Date("2026-10-02T10:00:00.005Z"), seen)).toBe(true);
  });

  it("counts another page separately", () => {
    const seen = new Map<string, string>();
    const now = new Date("2026-10-02T10:00:00Z");
    alreadyViewed("company:c1", now, seen);
    expect(alreadyViewed("company:c2", now, seen)).toBe(false);
    expect(alreadyViewed("product:c1", now, seen)).toBe(false);
  });

  it("counts once per calendar day: late evening and next morning are two views", () => {
    const seen = new Map<string, string>();
    // 08:00 and 23:30 Kinshasa on Oct 2, then 08:00 Kinshasa on Oct 3.
    expect(alreadyViewed("company:c1", new Date("2026-10-02T07:00:00Z"), seen)).toBe(false);
    expect(alreadyViewed("company:c1", new Date("2026-10-02T22:30:00Z"), seen)).toBe(true);
    expect(alreadyViewed("company:c1", new Date("2026-10-03T07:00:00Z"), seen)).toBe(false);
  });
});
