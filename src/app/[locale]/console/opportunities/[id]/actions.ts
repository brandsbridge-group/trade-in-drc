"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Server actions for moderating a single opportunity.
 *
 * Each decision (1) updates the opportunity's status under the admin RLS policy
 * and (2) writes an `opportunity_moderation_events` audit row recording who
 * acted, the action, and the optional reason (Req 8 — timestamps + audit
 * trails). Both writes go through the user-scoped server client so RLS is
 * enforced; `requireAdmin` is the UX-layer guard.
 *
 * The audit insert is best-effort relative to the status change: if the status
 * update fails we abort and report; if the audit insert fails after a
 * successful status change we surface the error (the caller refreshes either
 * way) rather than silently dropping the trail.
 */

const decisionSchema = z.object({
  opportunityId: dbId(),
  reason: z.string().trim().max(2000).optional(),
});

export interface ModerationResult {
  ok: boolean;
  error?: string;
}

async function recordDecision(
  opportunityId: string,
  reason: string | undefined,
  action: "approved" | "rejected",
  locale: string
): Promise<ModerationResult> {
  const parsed = decisionSchema.safeParse({ opportunityId, reason });
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const admin = await requireAdmin(locale);
  const supabase = await createServerSupabaseClient();

  const nextStatus = action === "approved" ? "published" : "rejected";
  const rejectedReason = action === "rejected" ? parsed.data.reason ?? null : null;

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({
      status: nextStatus,
      rejected_reason: rejectedReason,
    } as never)
    .eq("id", parsed.data.opportunityId);

  if (updateError) {
    console.error(
      `[opportunities.${action}] status update failed (${updateError.code ?? "unknown"}): ${updateError.message}`
    );
    return { ok: false, error: updateError.message };
  }

  const { error: auditError } = await supabase
    .from("opportunity_moderation_events")
    .insert({
      opportunity_id: parsed.data.opportunityId,
      actor_id: admin.id,
      action,
      reason: parsed.data.reason ?? null,
    } as never);

  if (auditError) {
    console.error(
      `[opportunities.${action}] audit insert failed (${auditError.code ?? "unknown"}): ${auditError.message}`
    );
    return { ok: false, error: auditError.message };
  }

  return { ok: true };
}

/** Approve an opportunity: publish it and record an `approved` audit event. */
export async function approveOpportunity(
  locale: string,
  opportunityId: string
): Promise<ModerationResult> {
  return recordDecision(opportunityId, undefined, "approved", locale);
}

/** Reject an opportunity: mark rejected with reason and record the audit event. */
export async function rejectOpportunity(
  locale: string,
  opportunityId: string,
  reason: string
): Promise<ModerationResult> {
  return recordDecision(opportunityId, reason, "rejected", locale);
}
