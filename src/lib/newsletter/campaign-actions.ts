"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSender, isEmailConfigured, sendEmail } from "@/lib/email/send";
import { configuredSiteOrigin } from "@/lib/site-url";
import { ROUTES } from "@/constants/routes";
import {
  CAMPAIGN_LANGUAGES,
  CAMPAIGN_LIMITS,
  campaignText,
  isCampaignReady,
  renderCampaignEmail,
  type NewsletterCampaign,
} from "./campaign-email";
import { processCampaignBatch, type CampaignProgress } from "./send-queue";

/**
 * Console side of the newsletter: drafts, test sends, and the "send" that
 * queues a campaign. Every action is super-admin only; they use the
 * service-role client because subscribers have no RLS policy at all.
 */

// A draft may be saved unfinished (one language, a subject only…): only the
// upper limits apply here. Completeness is checked when it is sent.
const subject = z.string().trim().max(CAMPAIGN_LIMITS.subjectMax);
const body = z.string().trim().max(CAMPAIGN_LIMITS.bodyMax);
const campaignSchema = z
  .object({ subject_en: subject, subject_fr: subject, body_en: body, body_fr: body })
  .refine((content) => Object.values(content).some((value) => value.length > 0));
const uuid = z.string().uuid();

/** Recipients per provider call (Resend's batch limit). */
const CAMPAIGN_BATCH_SIZE = 100;

export interface NewsletterOverview {
  subscribers: { active: number; activeEn: number; activeFr: number; pending: number; unsubscribed: number };
  /** The "From" campaigns are sent with, or null when none is configured. */
  sender: string | null;
  /** What still prevents any send, if anything. */
  blocker: "email_not_configured" | "site_url_missing" | null;
}

function revalidate(locale: string) {
  revalidatePath(`/${locale}${ROUTES.CONSOLE_NEWSLETTER}`, "layout");
}

function sendBlocker(): NewsletterOverview["blocker"] {
  if (!isEmailConfigured("newsletter")) return "email_not_configured";
  if (!configuredSiteOrigin()) return "site_url_missing";
  return null;
}

export async function listNewsletterCampaigns(locale: string): Promise<NewsletterCampaign[]> {
  await requireSuperAdmin(locale);
  const { data, error } = await createAdminClient()
    .from("newsletter_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Could not load newsletter campaigns.");
  return data ?? [];
}

export async function getNewsletterCampaign(locale: string, campaignId: string): Promise<NewsletterCampaign | null> {
  await requireSuperAdmin(locale);
  const id = uuid.safeParse(campaignId);
  if (!id.success) return null;
  const { data, error } = await createAdminClient()
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw new Error("Could not load the newsletter campaign.");
  return data;
}

/** Audience size and sending readiness. Counts only — subscriber addresses never reach the console. */
export async function getNewsletterOverview(locale: string): Promise<NewsletterOverview> {
  await requireSuperAdmin(locale);
  const admin = createAdminClient();
  const count = async (status: "pending" | "active" | "unsubscribed", language?: "en" | "fr") => {
    let query = admin.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", status);
    if (language) query = query.eq("locale", language);
    const { count: total, error } = await query;
    if (error) throw new Error("Could not count newsletter subscribers.");
    return total ?? 0;
  };
  const [activeEn, activeFr, pending, unsubscribed] = await Promise.all([
    count("active", "en"),
    count("active", "fr"),
    count("pending"),
    count("unsubscribed"),
  ]);
  return {
    subscribers: { active: activeEn + activeFr, activeEn, activeFr, pending, unsubscribed },
    sender: emailSender("newsletter"),
    blocker: sendBlocker(),
  };
}

/** Creates a draft, or updates one. Only a draft can be edited: anything else has already reached inboxes. */
export async function saveNewsletterCampaign(
  locale: string,
  input: unknown,
  campaignId?: string
): Promise<{ ok: true; id: string } | { ok: false; error: "invalid" | "not_editable" | "server" }> {
  const actor = await requireSuperAdmin(locale);
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  if (campaignId) {
    const id = uuid.safeParse(campaignId);
    if (!id.success) return { ok: false, error: "invalid" };
    const { data, error } = await admin
      .from("newsletter_campaigns")
      .update(parsed.data)
      .eq("id", id.data)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: "server" };
    if (!data) return { ok: false, error: "not_editable" };
    revalidate(locale);
    return { ok: true, id: data.id };
  }

  const { data, error } = await admin
    .from("newsletter_campaigns")
    .insert({ ...parsed.data, created_by: actor.id, status: "draft" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[newsletter] campaign create failed", error?.code);
    return { ok: false, error: "server" };
  }
  revalidate(locale);
  return { ok: true, id: data.id };
}

/** Copies any campaign into a new draft. */
export async function duplicateNewsletterCampaign(
  locale: string,
  campaignId: string
): Promise<{ ok: true; id: string } | { ok: false }> {
  const actor = await requireSuperAdmin(locale);
  const id = uuid.safeParse(campaignId);
  if (!id.success) return { ok: false };

  const admin = createAdminClient();
  const { data: source } = await admin
    .from("newsletter_campaigns")
    .select("subject_en, subject_fr, body_en, body_fr")
    .eq("id", id.data)
    .maybeSingle();
  if (!source) return { ok: false };
  const { data, error } = await admin
    .from("newsletter_campaigns")
    .insert({ ...source, created_by: actor.id, status: "draft" })
    .select("id")
    .single();
  if (error || !data) return { ok: false };
  revalidate(locale);
  return { ok: true, id: data.id };
}

/** Deletes a draft. A campaign that was sent stays: it is the record of what subscribers received. */
export async function deleteNewsletterCampaign(locale: string, campaignId: string): Promise<{ ok: boolean }> {
  await requireSuperAdmin(locale);
  const id = uuid.safeParse(campaignId);
  if (!id.success) return { ok: false };
  const { data, error } = await createAdminClient()
    .from("newsletter_campaigns")
    .delete()
    .eq("id", id.data)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false };
  revalidate(locale);
  return { ok: true };
}

/** Sends the campaign, in one language or both, to the signed-in super-admin only. */
export async function sendNewsletterTest(
  locale: string,
  input: unknown,
  languages: string[]
): Promise<{ ok: true; to: string } | { ok: false; error: "invalid" | "email_not_configured" | "site_url_missing" | "no_address" | "send_failed" }> {
  const actor = await requireSuperAdmin(locale);
  const parsed = campaignSchema.safeParse(input);
  const wanted = CAMPAIGN_LANGUAGES.filter((language) => languages.includes(language));
  if (!parsed.success || wanted.length === 0) return { ok: false, error: "invalid" };
  const blocker = sendBlocker();
  if (blocker) return { ok: false, error: blocker };
  if (!actor.email) return { ok: false, error: "no_address" };
  const origin = configuredSiteOrigin()!;

  for (const language of wanted) {
    const { subject, body } = campaignText(parsed.data, language);
    if (!subject || !body) return { ok: false, error: "invalid" };
    const result = await sendEmail(
      {
        to: actor.email,
        subject: `[Test] ${subject}`,
        // The unsubscribe line is shown as subscribers will see it; in a test it only leads to the site.
        ...renderCampaignEmail({ language, subject, body, origin, unsubscribeUrl: `${origin}/${language}` }),
      },
      { stream: "newsletter" }
    );
    if (!result.sent) return { ok: false, error: "send_failed" };
  }
  return { ok: true, to: actor.email };
}

/**
 * "Send": queues the campaign for every confirmed subscriber (or, for a
 * campaign to retry, for the recipients that failed). Nothing is e-mailed
 * here — {@link processNewsletterCampaign} and the cron route do it, batch by batch.
 */
export async function startNewsletterCampaign(
  locale: string,
  campaignId: string
): Promise<{ ok: true; queued: number } | { ok: false; error: "invalid" | "incomplete" | "not_sendable" | "no_recipients" | "email_not_configured" | "site_url_missing" | "server" }> {
  await requireSuperAdmin(locale);
  const id = uuid.safeParse(campaignId);
  if (!id.success) return { ok: false, error: "invalid" };
  const blocker = sendBlocker();
  if (blocker) return { ok: false, error: blocker };

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("newsletter_campaigns")
    .select("subject_en, subject_fr, body_en, body_fr")
    .eq("id", id.data)
    .maybeSingle();
  if (!campaign) return { ok: false, error: "not_sendable" };
  if (!isCampaignReady(campaign)) return { ok: false, error: "incomplete" };

  const { data, error } = await admin.rpc("newsletter_enqueue_campaign", {
    p_campaign_id: id.data,
    p_batch_size: CAMPAIGN_BATCH_SIZE,
  });
  if (error) {
    console.error("[newsletter] campaign could not be queued", error.code);
    return { ok: false, error: "server" };
  }
  const queued = Number(data);
  if (queued < 0) return { ok: false, error: "not_sendable" };
  if (queued === 0) return { ok: false, error: "no_recipients" };
  revalidate(locale);
  return { ok: true, queued };
}

/** Sends the next batch of a campaign being sent and reports its progress. */
export async function processNewsletterCampaign(locale: string, campaignId: string): Promise<CampaignProgress> {
  await requireSuperAdmin(locale);
  const id = uuid.parse(campaignId);
  const progress = await processCampaignBatch(createAdminClient(), id);
  if (progress.done) revalidate(locale);
  return progress;
}
