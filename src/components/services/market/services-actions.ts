"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Valid service intents (must match business_requests.intent CHECK). */
const SERVICE_INTENTS = [
  "partner_search",
  "market_entry",
  "business_verification",
  "b2b_meeting",
  "market_report",
  "local_representation",
  "delegation",
  "other",
] as const;

const serviceRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  company: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  sector: z.string().trim().max(120).optional().or(z.literal("")),
  serviceNeeded: z.enum(SERVICE_INTENTS),
  preferredLocation: z.string().trim().max(120).optional().or(z.literal("")),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

/**
 * "Request a Service" submission (design Our Services). Anonymous-friendly —
 * writes to business_requests (submitter_id NULL when signed out). Admins see
 * it at /admin/requests. Returns the generated TIDRC-PR-... reference.
 */
export async function submitServiceRequest(
  input: ServiceRequestInput
): Promise<{ ok: boolean; error?: "invalid" | "server"; reference?: string }> {
  const parsed = serviceRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const message = [
    `Service request: ${d.serviceNeeded}`,
    d.timeline ? `Timeline: ${d.timeline}` : null,
    d.message || null,
  ].filter(Boolean).join("\n");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("business_requests")
    .insert({
      submitter_id: user?.id ?? null,
      kind: "service",
      intent: d.serviceNeeded,
      full_name: d.fullName,
      company_name: d.company,
      country: d.country,
      email: d.email,
      phone: d.phone,
      sector: d.sector || null,
      preferred_location: d.preferredLocation || null,
      message,
    })
    .select("reference")
    .single<{ reference: string | null }>();

  if (error) {
    console.error("[submitServiceRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, reference: data?.reference ?? undefined };
}
