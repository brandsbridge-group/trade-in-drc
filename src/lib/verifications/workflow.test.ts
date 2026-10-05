import { describe, expect, it } from "vitest";
import { daysBetween, isOwnerEvent, isTierOverride, lastSubmittedAt, latestStaffMessage, ownerVisibleNotes, reviewStage, sortEvents, type ReviewEvent } from "./workflow";

const ev = (decision: string, createdAt: string, notes: string | null = null): ReviewEvent => ({ decision, createdAt, notes });

describe("reviewStage", () => {
  it("follows the status when it says everything", () => {
    expect(reviewStage("pending_documents", [])).toBe("not_submitted");
    expect(reviewStage("verified", [ev("approved", "2026-10-02")])).toBe("verified");
    expect(reviewStage("rejected", [ev("rejected", "2026-10-02")])).toBe("rejected");
  });

  it("puts a freshly sent file on staff's desk", () => {
    expect(reviewStage("pending", [ev("submitted", "2026-10-01")])).toBe("to_review");
    // Files sent before the `submitted` event existed have no trail at all.
    expect(reviewStage("pending", [])).toBe("to_review");
  });

  it("hands the file to the company after a request for more information, and back once it answers", () => {
    const asked = [ev("submitted", "2026-10-01T08:00:00Z"), ev("more_info_requested", "2026-10-02T08:00:00Z", "RCCM illisible")];
    expect(reviewStage("pending", asked)).toBe("awaiting_owner");
    expect(reviewStage("pending", [...asked, ev("resubmitted", "2026-10-03T08:00:00Z")])).toBe("to_review");
  });

  it("reads the LAST event whatever the order the rows come in", () => {
    const shuffled = [ev("more_info_requested", "2026-10-02T08:00:00Z"), ev("resubmitted", "2026-10-03T08:00:00Z"), ev("submitted", "2026-10-01T08:00:00Z")];
    expect(reviewStage("pending", shuffled)).toBe("to_review");
    expect(sortEvents(shuffled).map((e) => e.decision)).toEqual(["resubmitted", "more_info_requested", "submitted"]);
  });
});

describe("lastSubmittedAt", () => {
  it("is the latest send, not the first one and not a staff decision", () => {
    const events = [ev("submitted", "2026-10-01T08:00:00Z"), ev("more_info_requested", "2026-10-02T08:00:00Z"), ev("resubmitted", "2026-10-03T08:00:00Z")];
    expect(lastSubmittedAt(events, "2026-09-20T00:00:00Z")).toBe("2026-10-03T08:00:00Z");
  });

  it("falls back to the creation date for files with no send recorded", () => {
    expect(lastSubmittedAt([], "2026-09-20T00:00:00Z")).toBe("2026-09-20T00:00:00Z");
    expect(lastSubmittedAt([ev("approved", "2026-10-02")], "2026-09-20T00:00:00Z")).toBe("2026-09-20T00:00:00Z");
  });
});

describe("daysBetween", () => {
  it("counts whole days and never goes negative", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(daysBetween("2026-10-05T08:00:00Z", now)).toBe(0);
    expect(daysBetween("2026-10-02T11:00:00Z", now)).toBe(3);
    expect(daysBetween("2026-10-09T00:00:00Z", now)).toBe(0);
  });
});

describe("what the company may read", () => {
  it("shows staff's message", () => {
    expect(ownerVisibleNotes(ev("more_info_requested", "2026-10-02", "  Le RCCM est illisible. "))).toBe("Le RCCM est illisible.");
    expect(ownerVisibleNotes(ev("rejected", "2026-10-02", "Société radiée."))).toBe("Société radiée.");
  });

  it("hides technical markers: the tier override and anything stored on the owner's own sends", () => {
    expect(ownerVisibleNotes(ev("approved", "2026-10-02", "tier:verified"))).toBeNull();
    expect(ownerVisibleNotes(ev("more_info_requested", "2026-10-02", "tier:none"))).toBeNull();
    expect(ownerVisibleNotes(ev("resubmitted", "2026-10-02", "Resubmitted by company owner"))).toBeNull();
    expect(ownerVisibleNotes(ev("approved", "2026-10-02", null))).toBeNull();
  });

  it("tells a manual tier change from a real decision", () => {
    expect(isTierOverride(ev("approved", "2026-10-02", "tier:premium"))).toBe(true);
    expect(isTierOverride(ev("approved", "2026-10-02", "Dossier conforme, tier:premium accordé"))).toBe(false);
    expect(isOwnerEvent("submitted") && isOwnerEvent("resubmitted")).toBe(true);
    expect(isOwnerEvent("approved")).toBe(false);
  });
});

describe("latestStaffMessage", () => {
  it("is the note of staff's latest decision, approval included", () => {
    const events = [ev("submitted", "2026-10-01T08:00:00Z"), ev("approved", "2026-10-02T08:00:00Z", " Dossier conforme, bienvenue. ")];
    expect(latestStaffMessage(events)).toMatchObject({ decision: "approved", notes: "Dossier conforme, bienvenue." });
  });

  it("survives the owner's own send: the request stays readable after a resend", () => {
    const events = [
      ev("submitted", "2026-10-01T08:00:00Z"),
      ev("more_info_requested", "2026-10-02T08:00:00Z", "RCCM illisible"),
      ev("resubmitted", "2026-10-03T08:00:00Z"),
    ];
    expect(latestStaffMessage(events)?.notes).toBe("RCCM illisible");
  });

  it("does not let an old remark outlive a newer decision without a note", () => {
    const events = [ev("more_info_requested", "2026-10-02T08:00:00Z", "RCCM illisible"), ev("approved", "2026-10-04T08:00:00Z")];
    expect(latestStaffMessage(events)).toBeNull();
  });

  it("is null without a staff decision, and for internal markers", () => {
    expect(latestStaffMessage([])).toBeNull();
    expect(latestStaffMessage([ev("submitted", "2026-10-01T08:00:00Z")])).toBeNull();
    expect(latestStaffMessage([ev("approved", "2026-10-02T08:00:00Z", "tier:premium")])).toBeNull();
  });
});
