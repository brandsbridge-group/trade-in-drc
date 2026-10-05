"use server";

import { z } from "zod";

import { dbId } from "@/lib/validation/db-id";
import { CHAIN_KEYS } from "@/lib/marketplace/chain";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  segment: z.enum(CHAIN_KEYS),
  nature: z.string().trim().min(2).max(200),
  route: z.string().trim().max(200).optional().or(z.literal("")),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  fullName: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  items: z
    .array(z.object({ id: dbId(), kind: z.enum(["company", "institution"]) }))
    .max(20)
    .default([]),
  forProduct: dbId().optional().or(z.literal("")),
});

export type ChainRequestInput = z.input<typeof schema>;

interface Result {
  ok: boolean;
  reference?: string | null;
  error?: "invalid" | "server";
}

/**
 * "Can't find the right partner?" — one team-triaged lead per operation, with
 * the providers set aside in "My operation" attached. Names are resolved
 * server-side from the ids (never trusted from the client); guests must leave
 * a name and email, members use their account.
 */
export async function submitChainRequest(input: ChainRequestInput): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  let fullName = d.fullName || "";
  let email = d.email || "";
  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    fullName = fullName || profile?.full_name || user.email || "";
    email = email || user.email || "";
  }
  if (fullName.length < 2 || !email) return { ok: false, error: "invalid" };

  const companyIds = d.items.filter((i) => i.kind === "company").map((i) => i.id);
  const institutionIds = d.items.filter((i) => i.kind === "institution").map((i) => i.id);
  const [{ data: companies }, { data: institutions }, { data: product }] = await Promise.all([
    companyIds.length
      ? admin.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    institutionIds.length
      ? (admin as unknown as UntypedAdmin)
          .from("institutions")
          .select("id, acronym, name_en")
          .in("id", institutionIds)
      : Promise.resolve({ data: [] as { id: string; acronym: string; name_en: string }[] }),
    d.forProduct
      ? admin.from("products").select("id, name").eq("id", d.forProduct).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const providers = [
    ...(companies ?? []).map((c) => `- ${c.name} (${c.id})`),
    ...(institutions ?? []).map((i) => `- ${i.acronym} — ${i.name_en} (${i.id})`),
  ];

  const message = [
    `Chain request — segment: ${d.segment}`,
    `Operation: ${d.nature}`,
    d.route ? `Route / scope: ${d.route}` : null,
    d.deadline ? `Deadline: ${d.deadline}` : null,
    product ? `Context product: ${product.name} (${product.id})` : null,
    providers.length ? `Providers set aside (${providers.length}):\n${providers.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await admin
    .from("business_requests")
    .insert({
      submitter_id: user?.id ?? null,
      company_id: companies?.length === 1 ? companies[0].id : null,
      kind: "service",
      intent: "partner_search",
      full_name: fullName,
      email,
      sector: d.segment,
      preferred_location: d.route || null,
      timeline: d.deadline || null,
      message,
    })
    .select("reference")
    .single();

  if (error) {
    console.error("[submitChainRequest]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, reference: data?.reference ?? null };
}

/** `institutions` isn't in the typed schema (see contact-points/page.tsx). */
interface UntypedAdmin {
  from(table: "institutions"): {
    select(cols: string): {
      in(
        col: string,
        values: string[],
      ): Promise<{ data: { id: string; acronym: string; name_en: string }[] | null }>;
    };
  };
}
