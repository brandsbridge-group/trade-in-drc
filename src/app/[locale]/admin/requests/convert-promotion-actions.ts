"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCallerAdmin } from "@/lib/auth/require-caller-admin";
import { dbId } from "@/lib/validation/db-id";
import { findPlan } from "@/config/promotion-plans";
import { grantCompanyPremium } from "@/lib/premium/grant";

/**
 * Fulfil a promotion application.
 *
 * The /pricing page is anonymous-friendly, so an application lands in
 * `business_requests` as a lead — it carries the chosen package
 * (`promotion_plan`) but no company_id, because the applicant may not even have
 * an account yet. The entitlement flow (`premium_requests` → is_premium /
 * premium_plan / premium_since / premium_expires_at) is company-scoped, so the
 * two never met: approving a lead granted nothing.
 *
 * This closes the loop. An admin picks the company the lead belongs to, and we:
 *   1. record an approved `premium_requests` row (the audit trail the premium
 *      screen already reads), and
 *   2. apply the same grant `approvePremiumRequest` applies, and
 *   3. mark the lead `converted` so it leaves the open queue.
 */

const convertSchema = z.object({
  requestId: dbId(),
  companyId: dbId(),
});

export type ConvertPromotionInput = z.infer<typeof convertSchema>;

export interface ConvertPromotionResult {
  ok: boolean;
  error?:
    | "validation_failed"
    | "not_authorized"
    | "not_found"
    | "no_plan"
    | "already_converted"
    | "update_failed";
}

export async function convertPromotionLead(
  input: ConvertPromotionInput
): Promise<ConvertPromotionResult> {
  const parsed = convertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };

  const admin = await requireCallerAdmin();
  if (!admin.ok || !admin.userId) return { ok: false, error: "not_authorized" };

  const { requestId, companyId } = parsed.data;
  const db = createAdminClient();

  const { data: lead, error: leadError } = await db
    .from("business_requests")
    .select("id, status, promotion_plan, promotion_amount_usd")
    .eq("id", requestId)
    .maybeSingle();

  if (leadError || !lead) return { ok: false, error: "not_found" };
  if (!lead.promotion_plan) return { ok: false, error: "no_plan" };
  if (lead.status === "converted") return { ok: false, error: "already_converted" };

  // Price comes from the config, never from the row — the same anti-forgery
  // posture as the CHECK constraint in migration 00039.
  const plan = findPlan(lead.promotion_plan);
  if (!plan) return { ok: false, error: "no_plan" };

  const now = new Date();
  const nowIso = now.toISOString();

  // Claim the lead FIRST with a guarded update. Two admins acting at once would
  // otherwise both pass the status check above and each grant + insert an audit
  // row; only the request that actually flips the row proceeds.
  const { data: claimed, error: claimError } = await db
    .from("business_requests")
    .update({ status: "converted" })
    .eq("id", requestId)
    .neq("status", "converted")
    .select("id");
  if (claimError) return { ok: false, error: "update_failed" };
  if (!claimed || claimed.length === 0) {
    return { ok: false, error: "already_converted" };
  }

  const { error: prError } = await db.from("premium_requests").insert({
    company_id: companyId,
    // The admin is acting on the applicant's behalf — a lead has no account.
    requested_by: admin.userId,
    plan: plan.id,
    amount_usd: plan.amountUsd,
    billing_period: "year",
    status: "approved",
    reviewed_by: admin.userId,
    reviewed_at: nowIso,
  });
  if (prError) return { ok: false, error: "update_failed" };

  const granted = await grantCompanyPremium(db, companyId, plan.id, now);
  if (!granted.ok) return { ok: false, error: "update_failed" };

  revalidatePath("/admin/requests");
  revalidatePath("/admin/requests/premium");
  return { ok: true };
}

/** Companies an admin can attach a promotion lead to, newest first. */
export async function searchCompaniesForPromotion(
  query: string
): Promise<{ id: string; name: string; isPremium: boolean }[]> {
  const admin = await requireCallerAdmin();
  if (!admin.ok) return [];

  const db = createAdminClient();
  let q = db
    .from("companies")
    .select("id, name, is_premium")
    .order("created_at", { ascending: false })
    .limit(20);

  const term = query.trim();
  if (term) q = q.ilike("name", `%${term}%`);

  const { data } = await q;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    isPremium: Boolean(c.is_premium),
  }));
}
