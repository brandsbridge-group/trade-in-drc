"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
 */
export async function submitIntroRequest(input: IntroRequestInput): Promise<Result> {
  const parsed = introRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const messageParts = [
    `Introduction request for: ${d.companyName}`,
    `Interest: ${d.interest}`,
    d.message ? `Message: ${d.message}` : null,
  ].filter(Boolean);

  const admin = createAdminClient();
  const { error } = await admin.from("business_requests").insert({
    submitter_id: user?.id ?? null,
    company_id: d.companyId,
    kind: "business",
    intent: "find_partner",
    full_name: d.fullName,
    company_name: d.submitterCompany,
    email: d.email,
    phone: d.phone || null,
    message: messageParts.join("\n"),
  });

  if (error) {
    console.error("[submitIntroRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}
