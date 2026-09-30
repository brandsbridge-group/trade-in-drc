"use server";

import { z } from "zod";

import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const offerRequestSchema = z.object({
  productId: dbId(),
  quantity: z.string().trim().min(1).max(120),
  deliveryPlace: z.string().trim().min(2).max(160),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
  fullName: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
});

export type OfferRequestInput = z.infer<typeof offerRequestSchema>;

interface Result {
  ok: boolean;
  reference?: string | null;
  error?: "invalid" | "not_found" | "server";
}

/**
 * Offer-detail "Request a quote" form. Anonymous-friendly, like the other
 * team-triaged leads: the row lands in business_requests via the service-role
 * client and the visitor never sees the supplier's contact details. Product,
 * supplier and sector are resolved server-side from the id, never trusted
 * from the form.
 */
export async function submitOfferRequest(input: OfferRequestInput): Promise<Result> {
  const parsed = offerRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, company_id, categories(name_en)")
    .eq("id", d.productId)
    .maybeSingle();
  if (!product) return { ok: false, error: "not_found" };

  const category = (product as unknown as { categories: { name_en: string | null } | null })
    .categories;

  const messageParts = [
    `Quote request for product: ${product.name} (${product.id})`,
    `Quantity: ${d.quantity}`,
    `Delivery place: ${d.deliveryPlace}`,
    d.deadline ? `Deadline: ${d.deadline}` : null,
    d.details ? `Details: ${d.details}` : null,
  ].filter(Boolean);

  const { data, error } = await admin
    .from("business_requests")
    .insert({
      submitter_id: user?.id ?? null,
      company_id: product.company_id,
      kind: "business",
      intent: "buy",
      full_name: d.fullName,
      company_name: d.companyName || null,
      country: d.country,
      email: d.email,
      phone: d.phone || null,
      sector: category?.name_en ?? null,
      preferred_location: d.deliveryPlace,
      timeline: d.deadline || null,
      message: messageParts.join("\n"),
    })
    .select("reference")
    .single();

  if (error) {
    console.error("[submitOfferRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, reference: data?.reference ?? null };
}
