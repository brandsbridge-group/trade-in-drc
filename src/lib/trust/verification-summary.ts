import { z } from "zod";
import type { VerificationCheck, VerificationSummary } from "./types";

// Canonical checklist keys for the structured verification summary. These map to
// the KYB / KYP / inspection items the Ministry reviewer attests to, and align
// 1:1 with the Trust.report.checks.* i18n keys rendered on the public report.
export const VERIFICATION_CHECK_KEYS = [
  "kyb",
  "address",
  "tax",
  "license",
  "site_visit",
  "audit",
] as const;

export const VERIFICATION_CHECK_STATUSES = [
  "passed",
  "pending",
  "failed",
] as const;

export const verificationCheckSchema = z.object({
  key: z.enum(VERIFICATION_CHECK_KEYS),
  status: z.enum(VERIFICATION_CHECK_STATUSES),
  note_en: z.string().trim().max(500).optional(),
  note_fr: z.string().trim().max(500).optional(),
  completed_at: z.string().optional(),
});

export const verificationSummarySchema = z.object({
  checks: z.array(verificationCheckSchema),
  notes_en: z.string().trim().max(2000).optional(),
  notes_fr: z.string().trim().max(2000).optional(),
});

export type VerificationCheckKey = (typeof VERIFICATION_CHECK_KEYS)[number];
export type VerificationCheckStatus = (typeof VERIFICATION_CHECK_STATUSES)[number];

/**
 * Safely coerce a raw `verification_summary` JSON value (from the DB) into a
 * typed VerificationSummary. Returns null when the value is absent or does not
 * match the schema, so callers never render half-valid trust data.
 */
export function parseVerificationSummary(
  raw: unknown
): VerificationSummary | null {
  if (raw == null) return null;
  const parsed = verificationSummarySchema.safeParse(raw);
  if (!parsed.success) return null;
  // Drop empty optional strings so the JSON payload stays clean.
  return normalizeSummary(parsed.data as VerificationSummary);
}

/** Strip empty notes and de-duplicate checks (last write per key wins). */
export function normalizeSummary(summary: VerificationSummary): VerificationSummary {
  const byKey = new Map<VerificationCheckKey, VerificationCheck>();
  for (const check of summary.checks) {
    byKey.set(check.key, {
      key: check.key,
      status: check.status,
      ...(check.note_en?.trim() ? { note_en: check.note_en.trim() } : {}),
      ...(check.note_fr?.trim() ? { note_fr: check.note_fr.trim() } : {}),
      ...(check.completed_at ? { completed_at: check.completed_at } : {}),
    });
  }
  return {
    checks: VERIFICATION_CHECK_KEYS.filter((k) => byKey.has(k)).map(
      (k) => byKey.get(k)!
    ),
    ...(summary.notes_en?.trim() ? { notes_en: summary.notes_en.trim() } : {}),
    ...(summary.notes_fr?.trim() ? { notes_fr: summary.notes_fr.trim() } : {}),
  };
}
