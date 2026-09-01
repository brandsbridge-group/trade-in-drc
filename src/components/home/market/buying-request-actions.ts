"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const buyingRequestSchema = z.object({
  productNeeded: z.string().trim().min(2).max(200),
  sector: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
  companyName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  additional: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type BuyingRequestInput = z.infer<typeof buyingRequestSchema>;

interface Result {
  ok: boolean;
  error?: "invalid" | "server";
}

/**
 * Homepage buying-request rail (design 1). Anonymous-friendly: inserts via the
 * service-role client with submitter_id = auth user when signed in, NULL
 * otherwise (migration 00028 makes the column nullable).
 */
export async function submitBuyingRequest(input: BuyingRequestInput): Promise<Result> {
  const parsed = buyingRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const messageParts = [
    `Product needed: ${d.productNeeded}`,
    d.quantity ? `Quantity: ${d.quantity}` : null,
    d.additional ? `Additional requirements: ${d.additional}` : null,
  ].filter(Boolean);

  const admin = createAdminClient();
  const { error } = await admin.from("business_requests").insert({
    submitter_id: user?.id ?? null,
    kind: "business",
    intent: "buy",
    full_name: d.companyName,
    company_name: d.companyName,
    country: d.country,
    email: d.email,
    phone: d.phone,
    sector: d.sector || null,
    message: messageParts.join("\n"),
  });

  if (error) {
    console.error("[submitBuyingRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}
