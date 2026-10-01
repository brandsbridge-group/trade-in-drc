import { describe, expect, it } from "vitest";
import { buildDashboardTasks, type TaskInput } from "./tasks";
import { profileCompleteness, type CompletenessInput } from "./profile-completeness";
import { ratePct, ratePointsDelta, trendOf } from "./metrics";

const NOW = new Date("2026-09-30T12:00:00Z");

const emptyInput: TaskInput = {
  now: NOW,
  companies: [],
  awaitingReplies: { count: 0, oldestAt: null },
  newResponses: 0,
  completeness: null,
};

describe("trendOf", () => {
  it("reports the signed direction and absolute whole percent", () => {
    expect(trendOf(118, 100)).toEqual({ direction: "up", pct: 18 });
    expect(trendOf(96, 100)).toEqual({ direction: "down", pct: 4 });
  });
  it("has no percentage without a previous baseline", () => {
    expect(trendOf(5, 0)).toEqual({ direction: "new", pct: null });
    expect(trendOf(0, 0)).toEqual({ direction: "flat", pct: 0 });
  });
});

describe("ratePct / ratePointsDelta", () => {
  it("computes a one-decimal percentage and point delta", () => {
    expect(ratePct(39, 1248)).toBe(3.1);
    expect(ratePct(3, 0)).toBeNull();
    expect(ratePointsDelta(3.1, 2.7)).toBe(0.4);
    expect(ratePointsDelta(3.1, null)).toBeNull();
  });
});

describe("profileCompleteness", () => {
  const full: CompletenessInput = {
    logo_url: "x.png",
    description: "a".repeat(120),
    contact_email: "a@b.cd",
    contact_phone: "+243",
    city: "Goma",
    website: "https://x.cd",
    certifications: ["ISO"],
    markets: ["EU"],
    photoCount: 3,
    productCount: 2,
  };

  it("scores a complete profile at 100", () => {
    expect(profileCompleteness(full)).toEqual({ percent: 100, missing: [] });
  });

  it("lists missing items most persuasive first", () => {
    const r = profileCompleteness({ ...full, logo_url: null, photoCount: 1, website: null });
    expect(r.missing).toEqual(["logo", "photos", "website"]);
    expect(r.percent).toBe(67);
  });

  it("treats a short description as missing", () => {
    expect(profileCompleteness({ ...full, description: "Coffee" }).missing).toEqual(["description"]);
  });
});

describe("buildDashboardTasks", () => {
  it("is empty when nothing needs doing", () => {
    expect(buildDashboardTasks(emptyInput)).toEqual([]);
  });

  it("puts blocking verification first, then messages, then profile", () => {
    const tasks = buildDashboardTasks({
      ...emptyInput,
      companies: [{ id: "c1", name: "Kivu", status: "pending_documents" }],
      awaitingReplies: { count: 3, oldestAt: "2026-09-28T09:00:00Z" },
      completeness: { percent: 72, missing: ["photos", "certifications"] },
    });
    expect(tasks.map((t) => t.kind)).toEqual([
      "verification_documents",
      "messages_awaiting",
      "profile_incomplete",
    ]);
    expect(tasks[1].values).toEqual({ count: 3, days: 2 });
    expect(tasks[2].values).toMatchObject({ percent: 72, first: "photos", second: "certifications" });
  });

  it("carries the reviewer's notes on a rejection", () => {
    const [task] = buildDashboardTasks({
      ...emptyInput,
      companies: [{ id: "c1", name: "Kivu", status: "rejected", latestReviewNotes: "Photos manquantes" }],
    });
    expect(task).toMatchObject({ kind: "verification_rejected", tone: "blocking", values: { notes: "Photos manquantes" } });
  });

  it("warns about Premium within 30 days and flags an expired plan", () => {
    const tasks = buildDashboardTasks({
      ...emptyInput,
      companies: [
        { id: "a", name: "A", status: "verified", isPremium: true, premiumExpiresAt: "2026-10-12T12:00:00Z" },
        { id: "b", name: "B", status: "verified", isPremium: true, premiumExpiresAt: "2026-09-01T00:00:00Z" },
        { id: "c", name: "C", status: "verified", isPremium: true, premiumExpiresAt: "2027-06-01T00:00:00Z" },
      ],
    });
    expect(tasks.map((t) => [t.kind, t.companyId])).toEqual([
      ["premium_expired", "b"],
      ["premium_expiring", "a"],
    ]);
    expect(tasks[1].values).toEqual({ days: 12 });
  });

  it("does not nag a fully complete profile", () => {
    const tasks = buildDashboardTasks({ ...emptyInput, completeness: { percent: 100, missing: [] } });
    expect(tasks).toEqual([]);
  });
});

describe("chart axis (niceMax) and mini bars (bucketSeries)", async () => {
  const { niceMax } = await import("@/components/dashboard/overview/activity-chart");
  const { bucketSeries } = await import("@/components/dashboard/overview/kpi-tile");

  it("keeps every gridline step a whole, round number", () => {
    for (const v of [1, 7, 45, 99, 100, 250, 1234, 98765]) {
      const max = niceMax(v);
      expect(max).toBeGreaterThanOrEqual(v);
      expect(Number.isInteger(max / 4)).toBe(true);
    }
    expect(niceMax(45)).toBe(60);
    expect(niceMax(100)).toBe(100);
  });

  it("folds a daily series into at most 12 buckets, keeping the total", () => {
    const days = Array.from({ length: 30 }, (_, i) => i);
    const bars = bucketSeries(days);
    expect(bars.length).toBeLessThanOrEqual(12);
    expect(bars.reduce((a, b) => a + b, 0)).toBe(days.reduce((a, b) => a + b, 0));
    expect(bucketSeries([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
