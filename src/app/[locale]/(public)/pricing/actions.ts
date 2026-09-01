"use server";

import { revalidatePath } from "next/cache";
import {
  PROMOTION_PLANS,
  findPlan,
  type PromotionPlanId,
} from "@/config/promotion-plans";
import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public-facing Premium request flow (premium_requests, migration 00022).
 *
 * An owner may request a Premium profile for a company they own. The insert runs
 * through the cookie-aware server client under the owner RLS policy
 * (submitter must own the company). The status / amount_usd / plan columns are
 * column-protected — we set amount_usd / plan here on the owner-allowed insert,
 * but admins later transition status. A unique partial index blocks a second
 * pending request for the same company; we translate that conflict into a clean
 * `pending_exists` result instead of leaking the Postgres error.
 */

// Plans and prices live in ONE place — src/config/promotion-plans.ts — which
// the DB CHECK constraint (00023/00039) mirrors. Duplicating them here is how
// a price change silently disagrees with the constraint.
const PREMIUM_PLANS = PROMOTION_PLANS.map((p) => p.id) as [
  PromotionPlanId,
  ...PromotionPlanId[],
];

const requestPremiumSchema = z.object({
  companyId: dbId(),
  plan: z.enum(PREMIUM_PLANS),
});

export type RequestPremiumInput = z.input<typeof requestPremiumSchema>;

export interface RequestPremiumResult {
  ok: boolean;
  error?:
    | "validation_failed"
    | "not_authenticated"
    | "not_authorized"
    | "already_premium"
    | "pending_exists"
    | "write_failed";
}

// Postgres unique-violation error code (duplicate pending request).
const UNIQUE_VIOLATION = "23505";

export async function requestPremium(
  input: RequestPremiumInput
): Promise<RequestPremiumResult> {
  const parsed = requestPremiumSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }

  const { companyId, plan } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, error: "not_authenticated" };
  }

  // Verify the caller owns the target company. `is_premium` is admin-only for
  // writes but readable by the owner, so we can short-circuit if already active.
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, is_premium")
    .eq("id", companyId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (companyError) {
    return { ok: false, error: "write_failed" };
  }
  if (!company) {
    return { ok: false, error: "not_authorized" };
  }
  if (company.is_premium) {
    return { ok: false, error: "already_premium" };
  }

  const { error: insertError } = await supabase.from("premium_requests").insert({
    company_id: companyId,
    requested_by: auth.user.id,
    plan,
    amount_usd: findPlan(plan)!.amountUsd,
    billing_period: "year",
  });

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "pending_exists" };
    }
    return { ok: false, error: "write_failed" };
  }

  // Surface the new pending state on the owner's dashboard (PremiumStatusCard)
  // and the pricing page (owner-facing premium state) without a manual reload.
  revalidatePath("/dashboard");
  revalidatePath("/pricing");

  return { ok: true };
}

export interface CancelPremiumRequestResult {
  ok: boolean;
  error?: "not_authenticated" | "no_pending" | "write_failed";
}

/**
 * Owner-initiated cancellation of their own pending Premium request.
 *
 * `premium_requests.status` is REVOKE'd from `authenticated`, so the owner
 * cannot transition the row themselves. We verify ownership with the
 * cookie-aware server client (auth + `requested_by = user.id`, `status = 'pending'`)
 * and only then use the service-role admin client to set `status = 'cancelled'`
 * on that specific row id.
 */
export async function cancelPremiumRequest(): Promise<CancelPremiumRequestResult> {
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, error: "not_authenticated" };
  }

  // Find the caller's own pending request under the owner RLS read policy.
  const { data: pending, error: pendingError } = await supabase
    .from("premium_requests")
    .select("id")
    .eq("requested_by", auth.user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingError) {
    return { ok: false, error: "write_failed" };
  }
  if (!pending) {
    return { ok: false, error: "no_pending" };
  }

  // Ownership verified above; service-role write is scoped to that row id only.
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("premium_requests")
    .update({ status: "cancelled" })
    .eq("id", pending.id);

  if (updateError) {
    return { ok: false, error: "write_failed" };
  }

  revalidatePath("/dashboard");

  return { ok: true };
}
