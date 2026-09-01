// Single source of truth: derived from the VERIFICATION_TIER const.
// Re-exported here so existing `@/lib/trust/types` importers keep working.
export type { VerificationTier } from "@/constants/status";

export interface VerificationCheck {
  key: "kyb" | "address" | "tax" | "license" | "site_visit" | "audit";
  status: "passed" | "pending" | "failed";
  note_en?: string;
  note_fr?: string;
  completed_at?: string;
}

export interface VerificationSummary {
  checks: VerificationCheck[];
  notes_en?: string;
  notes_fr?: string;
}
