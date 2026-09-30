"use server";

import { z } from "zod";

import { dbId } from "@/lib/validation/db-id";
import { locales } from "@/config/locales";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; reference?: string | null; error?: "invalid" | "server" };

const alertSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  sectorIds: z.array(dbId()).max(30).default([]),
  locale: z.enum(locales).default("fr"),
});

/**
 * "Receive the notices of your sector every Monday" — one row per e-mail in
 * opportunity_alerts (00050). Re-subscribing replaces the followed sectors
 * and clears a previous unsubscribe. Service-role write: the table has no
 * public policy.
 */
export async function subscribeToAlerts(input: z.input<typeof alertSchema>): Promise<Result> {
  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const { error } = await createAdminClient()
    .from("opportunity_alerts")
    .upsert(
      { email: d.email, sector_ids: d.sectorIds, locale: d.locale, unsubscribed_at: null },
      { onConflict: "email" },
    );
  if (error) {
    console.error("[subscribeToAlerts]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

const noticeSchema = z.object({
  organisation: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  title: z.string().trim().min(4).max(240),
  link: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\//i)
    .optional()
    .or(z.literal("")),
  deadline: z.string().trim().max(40).optional().or(z.literal("")),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
});

/**
 * "Submit a notice" — no account needed. Lands in business_requests
 * (intent publish_opportunity) for the team to vet and republish.
 */
export async function submitNotice(input: z.input<typeof noticeSchema>): Promise<Result> {
  const parsed = noticeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const message = [
    "Notice submitted for publication on the Opportunities board.",
    `Title: ${d.title}`,
    d.link ? `Notice / dossier: ${d.link}` : null,
    d.deadline ? `Deadline: ${d.deadline}` : null,
    d.details ? `Details: ${d.details}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await createAdminClient()
    .from("business_requests")
    .insert({
      submitter_id: user?.id ?? null,
      kind: "business",
      intent: "publish_opportunity",
      full_name: d.organisation,
      company_name: d.organisation,
      email: d.email,
      timeline: d.deadline || null,
      message,
    })
    .select("reference")
    .single();
  if (error) {
    console.error("[submitNotice]", error.code, error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, reference: data?.reference ?? null };
}
