"use server";

import { z } from "zod";
import { grantCompanyPremium } from "@/lib/premium/grant";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCallerAdmin } from "@/lib/auth/require-caller-admin";
import type { PremiumPlan } from "@/lib/supabase/types";

/**
 * Admin review actions for Premium profile requests (migration 00022).
 *
 * Approving a request flips admin-only, REVOKE'd columns on both
 * `premium_requests` (status / reviewed_by / reviewed_at / admin_notes) and
 * `companies` (is_premium / premium_plan / premium_since / premium_expires_at).
 * Owners have no UPDATE grant on those columns, so the mutation MUST run through
 * the service-role admin client. The caller's admin role is re-checked here so a
 * non-admin gets a clean error rather than silently writing nothing.
 */


const reviewSchema = z.object({
  id: dbId(),
  note: z.string().trim().max(2000).optional(),
});

export type ReviewPremiumInput = z.input<typeof reviewSchema>;

export interface ReviewPremiumResult {
  ok: boolean;
  error?:
    | "not_authorized"
    | "validation_failed"
    | "not_found"
    | "not_pending"
    | "update_failed";
}

export async function approvePremiumRequest(
  input: ReviewPremiumInput
): Promise<ReviewPremiumResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }

  const admin = await requireCallerAdmin();
  if (!admin.ok || !admin.userId) {
    return { ok: false, error: "not_authorized" };
  }

  // Load the request through the cookie-aware server client (admin RLS allows
  // reads) so we know which company + plan to activate.
  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from("premium_requests")
    .select("id, company_id, plan, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  // Only a pending request can be approved. Guarding here (and again in the
  // scoped UPDATE below) prevents a concurrent/duplicate approve from
  // re-granting premium and resetting the expiry window.
  if (request.status !== "pending") {
    return { ok: false, error: "not_pending" };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const plan = request.plan as PremiumPlan;

  const adminClient = createAdminClient();

  // Scope the flip to `status = 'pending'` so two approvals racing on the same
  // request can only ever update the row once. The second loses the CAS and the
  // returned row set is empty → we bail before double-granting premium.
  const { data: approvedRows, error: requestError } = await adminClient
    .from("premium_requests")
    .update({
      status: "approved",
      reviewed_by: admin.userId,
      reviewed_at: nowIso,
      admin_notes: parsed.data.note ?? null,
    })
    .eq("id", request.id)
    .eq("status", "pending")
    .select("id");

  if (requestError) {
    return { ok: false, error: "update_failed" };
  }

  if (!approvedRows || approvedRows.length === 0) {
    return { ok: false, error: "not_pending" };
  }

  const granted = await grantCompanyPremium(adminClient, request.company_id, plan, now);
  if (!granted.ok) {
    return { ok: false, error: "update_failed" };
  }

  revalidatePath("/admin/requests/premium");
  return { ok: true };
}

export async function rejectPremiumRequest(
  input: ReviewPremiumInput
): Promise<ReviewPremiumResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }

  const admin = await requireCallerAdmin();
  if (!admin.ok || !admin.userId) {
    return { ok: false, error: "not_authorized" };
  }

  // Confirm the request exists and is still pending before rejecting it, so an
  // already-reviewed request can't be silently re-stamped.
  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from("premium_requests")
    .select("id, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  if (request.status !== "pending") {
    return { ok: false, error: "not_pending" };
  }

  const adminClient = createAdminClient();
  const { data: rejectedRows, error } = await adminClient
    .from("premium_requests")
    .update({
      status: "rejected",
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
      admin_notes: parsed.data.note ?? null,
    })
    .eq("id", request.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: "update_failed" };
  }

  if (!rejectedRows || rejectedRows.length === 0) {
    return { ok: false, error: "not_pending" };
  }

  revalidatePath("/admin/requests/premium");
  return { ok: true };
}
