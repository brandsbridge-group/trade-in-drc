import { COMPANY_STATUS, VERIFICATION_DECISION } from "@/constants/status";

/** One entry of `verification_reviews`, as the screens read it. */
export interface ReviewEvent {
  decision: string;
  notes: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

/**
 * Where a company stands in the verification circuit — and whose turn it is.
 * `companies.status` alone cannot tell: after "request more information" the
 * company stays `pending` (so it comes back to the queue once the owner
 * answers), which made a file waiting on the OWNER look exactly like a file
 * waiting on STAFF. The last event settles it.
 */
export type ReviewStage = "not_submitted" | "to_review" | "awaiting_owner" | "verified" | "rejected";

export const REVIEW_STAGES: ReviewStage[] = ["not_submitted", "to_review", "awaiting_owner", "verified", "rejected"];

/** Newest first. */
export function sortEvents<T extends ReviewEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function reviewStage(status: string, events: ReviewEvent[]): ReviewStage {
  if (status === COMPANY_STATUS.VERIFIED) return "verified";
  if (status === COMPANY_STATUS.REJECTED) return "rejected";
  if (status === COMPANY_STATUS.PENDING_DOCUMENTS) return "not_submitted";
  const last = sortEvents(events)[0];
  return last?.decision === VERIFICATION_DECISION.MORE_INFO_REQUESTED ? "awaiting_owner" : "to_review";
}

const OWNER_EVENTS: string[] = [VERIFICATION_DECISION.SUBMITTED, VERIFICATION_DECISION.RESUBMITTED];

/** True for the events recorded on the owner's behalf (sends), false for staff decisions. */
export function isOwnerEvent(decision: string): boolean {
  return OWNER_EVENTS.includes(decision);
}

/**
 * When the file last landed on staff's desk: the latest send. Companies sent
 * before 00058 have no `submitted` event, so the creation date stands in.
 */
export function lastSubmittedAt(events: ReviewEvent[], createdAt: string): string {
  return sortEvents(events).find((e) => isOwnerEvent(e.decision))?.createdAt ?? createdAt;
}

/** Whole days between two instants, never negative. */
export function daysBetween(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86_400_000));
}

/** A file older than this in the queue is flagged as late. */
export const REVIEW_TARGET_DAYS = 2;

/**
 * Notes safe to show the OWNER. Two kinds of technical text are stored in
 * `notes` and must not surface as if staff had written them to the company:
 * the tier-override marker (`tier:verified`) and the legacy owner marker.
 */
export function ownerVisibleNotes(event: ReviewEvent): string | null {
  const notes = event.notes?.trim();
  if (!notes) return null;
  if (isOwnerEvent(event.decision)) return null;
  if (/^tier:[a-z_]+$/.test(notes)) return null;
  return notes;
}

/**
 * The message the company should be reading now: the note attached to staff's
 * LATEST decision (approval, refusal or request for more information). A later
 * decision without a note clears it — an old remark must not outlive the
 * decision it explained — but the owner's own sends do not.
 */
export function latestStaffMessage<T extends ReviewEvent>(events: T[]): (T & { notes: string }) | null {
  const lastDecision = sortEvents(events).find((event) => !isOwnerEvent(event.decision));
  if (!lastDecision) return null;
  const notes = ownerVisibleNotes(lastDecision);
  return notes ? { ...lastDecision, notes } : null;
}

/** True when staff wrote this event by overriding the tier rather than through the decision panel. */
export function isTierOverride(event: ReviewEvent): boolean {
  return /^tier:[a-z_]+$/.test(event.notes?.trim() ?? "");
}
