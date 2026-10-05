"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordContactRequest } from "@/lib/analytics/contact-request";

const INTEREST_VALUES = [
  "distribution",
  "investment",
  "partnership",
  "sourcing",
  "other",
] as const;

const introRequestSchema = z.object({
  companyId: dbId(),
  companyName: z.string().trim().min(1).max(200),
  fullName: z.string().trim().min(2).max(160),
  submitterCompany: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  interest: z.enum(INTEREST_VALUES),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type IntroRequestInput = z.infer<typeof introRequestSchema>;

interface Result {
  ok: boolean;
  error?: "invalid" | "server";
}

/**
 * Company-profile "Request Contact / Introduction" form (customer design 5).
 * Anonymous-friendly: the row is inserted via the service-role client, with
 * submitter_id set to the signed-in user or NULL for guests (migration 00028
 * makes the column nullable). The visitor never touches contact PII — this is a
 * one-way lead the Trade in DRC team triages before making an introduction.
 *
 * The company reads it only once staff has forwarded it (00062): the target,
 * the kind of relationship and the visitor's own words each have their column.
 */
export async function submitIntroRequest(input: IntroRequestInput): Promise<Result> {
  const parsed = introRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  // The target comes from the database, never from the form's company name.
  const { data: company } = await admin
    .from("companies")
    .select("id")
    .eq("id", d.companyId)
    .maybeSingle();
  if (!company) return { ok: false, error: "invalid" };

  const { error } = await admin.from("business_requests").insert({
    submitter_id: user?.id ?? null,
    company_id: company.id,
    target_company_id: company.id,
    interest: d.interest,
    kind: "business",
    intent: "find_partner",
    full_name: d.fullName,
    company_name: d.submitterCompany,
    email: d.email,
    phone: d.phone || null,
    message: d.message || "",
  });

  if (error) {
    console.error("[submitIntroRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  await recordContactRequest(company.id);
  return { ok: true };
}
