import { describe, expect, it } from "vitest";
import { buildTracking, normalizeReference, type TrackingInput } from "./tracking";

const base: TrackingInput = {
  status: "new",
  created_at: "2026-10-03T19:15:00Z",
  updated_at: "2026-10-03T19:15:00Z",
  target_company_id: null,
  forwarded_at: null,
};

const states = (row: TrackingInput) => buildTracking(row).steps.map((s) => `${s.key}:${s.state}`);

describe("buildTracking", () => {
  it("shows a new request as received and waiting for review", () => {
    expect(states(base)).toEqual(["received:done", "review:current", "outcome:upcoming"]);
    expect(buildTracking(base).outcome).toBeNull();
  });

  it("adds the forwarding step only for a request addressed to a company", () => {
    expect(states({ ...base, target_company_id: "c1" })).toEqual([
      "received:done",
      "review:current",
      "forwarded:upcoming",
      "outcome:upcoming",
    ]);
  });

  it("moves on once staff has picked it up", () => {
    expect(states({ ...base, status: "in_progress" })).toEqual(["received:done", "review:done", "outcome:current"]);
    expect(states({ ...base, status: "in_progress", target_company_id: "c1" })).toEqual([
      "received:done",
      "review:done",
      "forwarded:current",
      "outcome:upcoming",
    ]);
  });

  it("dates the forward", () => {
    const tracking = buildTracking({ ...base, status: "in_progress", target_company_id: "c1", forwarded_at: "2026-10-04T08:00:00Z" });
    expect(tracking.steps.map((s) => `${s.key}:${s.state}`)).toEqual([
      "received:done",
      "review:done",
      "forwarded:done",
      "outcome:current",
    ]);
    expect(tracking.steps[2].at).toBe("2026-10-04T08:00:00Z");
  });

  it("closes the trail when the request is handled", () => {
    const tracking = buildTracking({ ...base, status: "converted", updated_at: "2026-10-06T10:00:00Z" });
    expect(tracking.outcome).toBe("handled");
    expect(tracking.steps.every((s) => s.state === "done")).toBe(true);
    expect(tracking.steps.at(-1)?.at).toBe("2026-10-06T10:00:00Z");
  });

  it("stops where it was when the request is declined", () => {
    const tracking = buildTracking({ ...base, status: "rejected", target_company_id: "c1" });
    expect(tracking.outcome).toBe("declined");
    expect(tracking.steps.map((s) => `${s.key}:${s.state}`)).toEqual([
      "received:done",
      "review:done",
      "forwarded:upcoming",
      "outcome:done",
    ]);
  });
});

describe("normalizeReference", () => {
  it("accepts the reference however it is typed", () => {
    expect(normalizeReference("  tidrc-pr-2026-000129 ")).toBe("TIDRC-PR-2026-000129");
    expect(normalizeReference("TIDRC-PR-2026- 000129")).toBe("TIDRC-PR-2026-000129");
  });

  it("refuses anything else", () => {
    expect(normalizeReference("129")).toBeNull();
    expect(normalizeReference("TIDRC-PR-2026-129")).toBeNull();
    expect(normalizeReference("TIDRC-PR-2026-000129; drop table")).toBeNull();
  });
});
