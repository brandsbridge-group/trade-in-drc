"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Custom Market Intelligence request submission (customer design 11, Data Hub).
 *
 * Anonymous-friendly: a signed-in visitor gets their `submitter_id` attached,
 * but a logged-out submission is still accepted, so the insert runs through the
 * service-role admin client (RLS bypassed). Every field is Zod-validated at this
 * boundary. Admins review the result at /admin/requests.
 *
 * Returns the human-readable `reference` (migration 00030) so the confirmation
 * state can show the real Request ID.
 */

const FULL_NAME_MAX = 200;
const COMPANY_MAX = 200;
const EMAIL_MAX = 320;
const SECTOR_MAX = 120;
const MESSAGE_MAX = 5000;

const ERROR_VALIDATION = "validation_failed" as const;
const ERROR_INSERT = "insert_failed" as const;

const marketIntelSchema = z.object({
  fullName: z.string().trim().min(1).max(FULL_NAME_MAX),
  company: z.string().trim().min(1).max(COMPANY_MAX),
  sector: z.string().trim().min(1).max(SECTOR_MAX),
  email: z.string().trim().email().max(EMAIL_MAX),
  message: z.string().trim().max(MESSAGE_MAX).optional().nullable(),
});

export type MarketIntelInput = z.input<typeof marketIntelSchema>;

export interface MarketIntelResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

type BusinessRequestInsert =
  Database["public"]["Tables"]["business_requests"]["Insert"];

function composeMessage(detail: string | null | undefined): string {
  const body = detail?.trim();
  return body
    ? `Custom market intelligence request\n${body}`
    : "Custom market intelligence request";
}

export async function submitMarketIntelRequest(
  input: MarketIntelInput
): Promise<MarketIntelResult> {
  const parsed = marketIntelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: ERROR_VALIDATION };
  }
  const data = parsed.data;

  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();

  const payload: BusinessRequestInsert = {
    submitter_id: user?.id ?? null,
    company_id: null,
    kind: "business",
    intent: "market_report",
    full_name: data.fullName,
    company_name: data.company,
    email: data.email,
    sector: data.sector,
    message: composeMessage(data.message),
  };

  // `reference` (migration 00030) is not in the generated types yet, so we run
  // the insert through an untyped handle to select it back.
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: row, error } = await admin
    .from("business_requests")
    .insert(payload)
    .select("reference")
    .single();

  if (error) {
    console.error("[market-intel.submit]", error.code, error.message);
    return { ok: false, error: ERROR_INSERT };
  }

  const reference =
    (row as { reference?: string | null } | null)?.reference ?? undefined;
  return { ok: true, reference };
}
