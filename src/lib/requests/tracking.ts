import type { BusinessRequestStatus } from "@/lib/supabase/types";

/**
 * What a visitor sees when following a request with its reference: a short
 * trail of steps, each done, current or still to come. Pure — it only reads
 * the handful of columns that are safe to show (never staff notes or the
 * follow-up owner), and the rules are unit-tested.
 */

export type TrackingStepKey = "received" | "review" | "forwarded" | "outcome";
export type TrackingStepState = "done" | "current" | "upcoming";

export interface TrackingStep {
  key: TrackingStepKey;
  state: TrackingStepState;
  /** ISO date, when the step has one. */
  at: string | null;
}

/** How the request ended, once it has. */
export type TrackingOutcome = "handled" | "declined" | null;

export interface TrackingInput {
  status: BusinessRequestStatus;
  created_at: string;
  updated_at: string;
  /** Set when the request is addressed to one company (quote, contact). */
  target_company_id: string | null;
  forwarded_at: string | null;
}

export interface RequestTracking {
  steps: TrackingStep[];
  outcome: TrackingOutcome;
}

const HANDLED: BusinessRequestStatus[] = ["converted", "closed"];

export function buildTracking(row: TrackingInput): RequestTracking {
  const outcome: TrackingOutcome = HANDLED.includes(row.status) ? "handled" : row.status === "rejected" ? "declined" : null;
  const addressed = !!row.target_company_id;
  const forwarded = !!row.forwarded_at;
  // Staff has picked the request up as soon as it is no longer "new".
  const reviewed = row.status !== "new" || forwarded;

  const done: Record<TrackingStepKey, boolean> = {
    received: true,
    review: reviewed,
    forwarded,
    outcome: outcome !== null,
  };
  const at: Record<TrackingStepKey, string | null> = {
    received: row.created_at,
    review: null,
    forwarded: row.forwarded_at,
    outcome: outcome ? row.updated_at : null,
  };

  // "Forwarded to the supplier" only exists for a request addressed to a company.
  const keys: TrackingStepKey[] = addressed ? ["received", "review", "forwarded", "outcome"] : ["received", "review", "outcome"];
  // A declined request stops where it was: later steps never become "current".
  const firstOpen = outcome === "declined" ? undefined : keys.find((key) => !done[key]);

  return {
    outcome,
    steps: keys.map((key) => ({
      key,
      state: done[key] ? "done" : key === firstOpen ? "current" : "upcoming",
      at: done[key] ? at[key] : null,
    })),
  };
}

/** `TIDRC-PR-2026-000129`, whatever the case or the spaces typed around it. */
export function normalizeReference(input: string): string | null {
  const value = input.trim().toUpperCase().replace(/\s+/g, "");
  return /^TIDRC-PR-\d{4}-\d{6}$/.test(value) ? value : null;
}
