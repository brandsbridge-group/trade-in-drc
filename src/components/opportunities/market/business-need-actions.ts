"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NEED_TYPES } from "@/lib/opportunities/board-config";

const businessNeedSchema = z.object({
  needType: z.enum(NEED_TYPES),
  sector: z.string().trim().max(120).optional().or(z.literal("")),
  province: z.string().trim().max(80).optional().or(z.literal("")),
  companyName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
});

export type BusinessNeedInput = z.infer<typeof businessNeedSchema>;

/**
 * "Submit Your Business Need" (design 2 rail). Anonymous-friendly — writes to
 * business_requests (submitter_id NULL when signed out; migration 00028).
 */
export async function submitBusinessNeed(
  input: BusinessNeedInput
): Promise<{ ok: boolean; error?: "invalid" | "server" }> {
  const parsed = businessNeedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const message = [
    "Business need submitted from the Opportunities board.",
    d.sector ? `Sector: ${d.sector}` : null,
    d.province ? `Province: ${d.province}` : null,
  ].filter(Boolean).join("\n");

  const admin = createAdminClient();
  const { error } = await admin.from("business_requests").insert({
    submitter_id: user?.id ?? null,
    kind: "business",
    intent: d.needType,
    full_name: d.companyName,
    company_name: d.companyName,
    email: d.email,
    sector: d.sector || null,
    preferred_location: d.province || null,
    message,
  });

  if (error) {
    console.error("[submitBusinessNeed]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}
