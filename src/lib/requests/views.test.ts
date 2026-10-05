import { describe, expect, it } from "vitest";
import { handledRate, inView, needsForward, personInitials, viewCounts } from "./views";

const row = (status: Parameters<typeof inView>[0]["status"], target: string | null = null, forwarded: string | null = null) => ({
  status,
  target_company_id: target,
  forwarded_at: forwarded,
});

describe("needsForward", () => {
  it("is true for an open request addressed to a company that has not received it", () => {
    expect(needsForward(row("new", "c1"))).toBe(true);
    expect(needsForward(row("in_progress", "c1"))).toBe(true);
  });

  it("is false once forwarded, without a target, or when the request is closed", () => {
    expect(needsForward(row("in_progress", "c1", "2026-10-03T10:00:00Z"))).toBe(false);
    expect(needsForward(row("new"))).toBe(false);
    expect(needsForward(row("rejected", "c1"))).toBe(false);
  });
});

describe("viewCounts", () => {
  const rows = [
    row("new", "c1"),
    row("new"),
    row("in_progress", "c1", "2026-10-03T10:00:00Z"),
    row("pending"),
    row("converted"),
    row("closed"),
    row("rejected", "c1"),
  ];

  it("counts each quick view", () => {
    expect(viewCounts(rows)).toEqual({ all: 7, to_forward: 1, new: 2, in_progress: 1, pending: 1, done: 3 });
  });

  it("is all zeros for an empty list", () => {
    expect(viewCounts([])).toEqual({ all: 0, to_forward: 0, new: 0, in_progress: 0, pending: 0, done: 0 });
  });

  it("gives the share of requests already handled", () => {
    expect(handledRate(rows)).toBe(71);
    expect(handledRate([])).toBe(0);
  });
});

describe("personInitials", () => {
  it("takes the first two words", () => {
    expect(personInitials("Anke Vermeulen")).toBe("AV");
    expect(personInitials("  jean  pierre  kabila ")).toBe("JP");
    expect(personInitials("Rahul")).toBe("R");
  });

  it("falls back to a question mark", () => {
    expect(personInitials("")).toBe("?");
    expect(personInitials(null)).toBe("?");
  });
});
