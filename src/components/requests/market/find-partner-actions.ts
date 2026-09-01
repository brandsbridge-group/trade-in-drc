"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Find-a-Local-Partner submission (customer design 10).
 *
 * Anonymous-friendly: signed-in users get their `submitter_id` attached, but a
 * request from a logged-out visitor is still accepted (migration 00028 made the
 * column nullable). Because the insert must succeed regardless of session, it
 * runs through the service-role admin client (RLS bypassed) rather than the
 * cookie-aware client. Every field is validated with Zod at this boundary.
 *
 * Returns the human-readable `reference` (migration 00030, `TIDRC-PR-YYYY-NNNNNN`)
 * so the confirmation column can show the real Request ID.
 */

// --- constraints (mirror the business_requests CHECK limits, migration 00022)
const FULL_NAME_MAX = 200;
const COMPANY_NAME_MAX = 200;
const COUNTRY_MAX = 100;
const EMAIL_MAX = 320;
const PHONE_MAX = 50;
const SECTOR_MAX = 120;
const PREFERRED_LOCATION_MAX = 120;
const MESSAGE_MAX = 5000;

/** The 8 selectable needs → a valid `business_requests.intent` enum value. */
const NEED_INTENT_MAP = {
  supplier: "buy",
  distributor: "find_partner",
  representative: "local_representation",
  jv_partner: "find_partner",
  service_provider: "find_partner",
  institutional: "find_partner",
  enter_market: "market_entry",
  source_products: "buy",
} as const;

export const FIND_PARTNER_NEEDS = Object.keys(
  NEED_INTENT_MAP
) as (keyof typeof NEED_INTENT_MAP)[];

const ERROR_VALIDATION = "validation_failed" as const;
const ERROR_INSERT = "insert_failed" as const;

const findPartnerSchema = z.object({
  need: z.enum(FIND_PARTNER_NEEDS as [string, ...string[]]),
  companyName: z.string().trim().min(1).max(COMPANY_NAME_MAX),
  country: z.string().trim().min(1).max(COUNTRY_MAX),
  website: z.string().trim().max(300).optional().nullable(),
  contactPerson: z.string().trim().min(1).max(FULL_NAME_MAX),
  email: z.string().trim().email().max(EMAIL_MAX),
  phone: z.string().trim().max(PHONE_MAX).optional().nullable(),
  sector: z.string().trim().max(SECTOR_MAX).optional().nullable(),
  contactType: z.string().trim().max(120),
  targetProvince: z.string().trim().max(PREFERRED_LOCATION_MAX),
  productService: z.string().trim().max(300).optional().nullable(),
  volume: z.string().trim().max(120).optional().nullable(),
  timeline: z.string().trim().max(120),
  requirement: z.string().trim().min(1).max(MESSAGE_MAX),
  attachmentName: z.string().trim().max(300).optional().nullable(),
  preferences: z.array(z.string().trim().max(120)).max(8).optional(),
});

export type FindPartnerInput = z.input<typeof findPartnerSchema>;

export interface FindPartnerResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

type BusinessRequestInsert =
  Database["public"]["Tables"]["business_requests"]["Insert"];

function nullIfBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Compose every extra detail into the free-text `message` column. */
function composeMessage(data: z.infer<typeof findPartnerSchema>): string {
  const lines: string[] = [
    `Primary need: ${data.need}`,
    `Type of contact needed: ${data.contactType}`,
  ];
  if (data.productService) lines.push(`Product / service of interest: ${data.productService}`);
  if (data.website) lines.push(`Website: ${data.website}`);
  if (data.volume) lines.push(`Estimated business volume (USD): ${data.volume}`);
  lines.push(`Expected timeline: ${data.timeline}`);
  if (data.preferences?.length) lines.push(`Preferences: ${data.preferences.join("; ")}`);
  if (data.attachmentName) lines.push(`Attachment provided: ${data.attachmentName}`);
  lines.push("", "Detailed requirement:", data.requirement.trim());
  return lines.join("\n");
}

export async function submitFindPartnerRequest(
  input: FindPartnerInput
): Promise<FindPartnerResult> {
  const parsed = findPartnerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: ERROR_VALIDATION };
  }
  const data = parsed.data;

  // Attach the submitter when signed in; null keeps anonymous submissions valid.
  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();

  const payload: BusinessRequestInsert = {
    submitter_id: user?.id ?? null,
    company_id: null,
    intent: NEED_INTENT_MAP[data.need as keyof typeof NEED_INTENT_MAP],
    full_name: data.contactPerson.trim(),
    company_name: nullIfBlank(data.companyName),
    country: nullIfBlank(data.country),
    email: data.email.trim(),
    phone: nullIfBlank(data.phone),
    sector: nullIfBlank(data.sector),
    preferred_location: nullIfBlank(data.targetProvince),
    timeline: nullIfBlank(data.timeline),
    message: composeMessage(data),
  };

  // `reference` was added in migration 00030 and is not in the generated types
  // yet, so we run the insert through an untyped handle to select it back.
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: row, error } = await admin
    .from("business_requests")
    .insert(payload)
    .select("reference")
    .single();

  if (error) {
    console.error("[find-partner.submit]", error.code, error.message);
    return { ok: false, error: ERROR_INSERT };
  }

  const reference =
    (row as { reference?: string | null } | null)?.reference ?? undefined;
  return { ok: true, reference };
}
