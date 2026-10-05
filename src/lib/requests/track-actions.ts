"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildTracking, normalizeReference, type RequestTracking } from "./tracking";

/**
 * "Follow my request": a visitor gives the reference shown after sending AND
 * the e-mail address used, and gets the request's progress.
 *
 * References are sequential, so the reference alone proves nothing: the e-mail
 * must match too, and a wrong pair gets the same answer as an unknown
 * reference. Only what is safe to show leaves this function — never the staff
 * note, the follow-up owner or the internal status.
 */

export interface TrackedRequest {
  reference: string;
  createdAt: string;
  /** What the request was about, when the row says so. */
  productName: string | null;
  companyName: string | null;
  tracking: RequestTracking;
}

export interface TrackResult {
  ok: boolean;
  request?: TrackedRequest;
  error?: "invalid" | "not_found" | "server";
}

export async function trackRequest(input: { reference: string; email: string }): Promise<TrackResult> {
  const reference = normalizeReference(input.reference ?? "");
  const email = (input.email ?? "").trim().toLowerCase();
  if (!reference || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("business_requests")
    .select("reference, email, status, created_at, updated_at, target_company_id, product_id, forwarded_at")
    .eq("reference", reference)
    .maybeSingle();
  if (error) {
    console.error("[trackRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  if (!row || row.email.trim().toLowerCase() !== email) return { ok: false, error: "not_found" };

  const [company, product] = await Promise.all([
    row.target_company_id
      ? admin.from("companies").select("name").eq("id", row.target_company_id).maybeSingle()
      : null,
    row.product_id ? admin.from("products").select("name").eq("id", row.product_id).maybeSingle() : null,
  ]);

  return {
    ok: true,
    request: {
      reference,
      createdAt: row.created_at,
      productName: product?.data?.name ?? null,
      companyName: company?.data?.name ?? null,
      tracking: buildTracking(row),
    },
  };
}
