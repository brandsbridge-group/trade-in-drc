"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignEmail, sendEmailBatch } from "@/lib/email/resend";
import type { Database } from "@/lib/supabase/types";

const campaignSchema = z.object({
  subject_en: z.string().trim().min(3).max(180),
  subject_fr: z.string().trim().min(3).max(180),
  body_en: z.string().trim().min(20).max(8000),
  body_fr: z.string().trim().min(20).max(8000),
});

const CAMPAIGN_BATCH_SIZE = 100;
const RECIPIENT_LIMIT = 500;
const ORIGIN = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export type NewsletterCampaign = Database["public"]["Tables"]["newsletter_campaigns"]["Row"];

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function listNewsletterCampaigns(locale: string): Promise<NewsletterCampaign[]> {
  await requireSuperAdmin(locale);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load newsletter campaigns.");
  return data ?? [];
}

export async function createNewsletterCampaign(
  locale: string,
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireSuperAdmin(locale);
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_campaigns").insert({
    ...parsed.data,
    created_by: actor.id,
    status: "draft",
  });
  if (error) {
    console.error("[newsletter] campaign create failed", error.code);
    return { ok: false, error: "server" };
  }
  revalidatePath(`/${locale}/console/newsletter`);
  return { ok: true };
}

export async function sendNewsletterCampaign(
  locale: string,
  campaignId: string
): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> {
  await requireSuperAdmin(locale);
  const id = z.string().uuid().safeParse(campaignId);
  if (!id.success) return { ok: false, sent: 0, failed: 0, error: "invalid" };

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id.data)
    .maybeSingle();
  if (campaignError || !campaign) return { ok: false, sent: 0, failed: 0, error: "not_found" };
  if (campaign.status === "sent" || campaign.status === "sending") {
    return { ok: false, sent: campaign.sent_count, failed: campaign.failed_count, error: "not_sendable" };
  }

  const { data: startedCampaign, error: startError } = await admin
    .from("newsletter_campaigns")
    .update({ status: "sending" })
    .eq("id", id.data)
    .eq("status", campaign.status)
    .select("id")
    .maybeSingle();
  if (startError || !startedCampaign) {
    return { ok: false, sent: campaign.sent_count, failed: campaign.failed_count, error: "not_sendable" };
  }

  const subscribers: Array<{ id: string; email: string; locale: "en" | "fr" }> = [];
  for (let offset = 0; offset < RECIPIENT_LIMIT; offset += 1000) {
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("id, email, locale")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(offset, offset + 999);
    if (error) {
      await admin.from("newsletter_campaigns").update({ status: "failed" }).eq("id", id.data);
      return { ok: false, sent: 0, failed: 0, error: "recipients" };
    }
    subscribers.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  if (subscribers.length > RECIPIENT_LIMIT) {
    await admin.from("newsletter_campaigns").update({ status: "failed" }).eq("id", id.data);
    return { ok: false, sent: 0, failed: 0, error: "recipient_limit" };
  }

  const { data: priorDeliveries, error: deliveryLookupError } = await admin
    .from("newsletter_campaign_deliveries")
    .select("recipient_email, status")
    .eq("campaign_id", id.data);
  if (deliveryLookupError) {
    await admin.from("newsletter_campaigns").update({ status: "failed" }).eq("id", id.data);
    return { ok: false, sent: 0, failed: 0, error: "server" };
  }
  const alreadySent = new Set(
    (priorDeliveries ?? []).filter((delivery) => delivery.status === "sent").map((delivery) => delivery.recipient_email)
  );
  const recipients = subscribers.filter((subscriber) => !alreadySent.has(subscriber.email));
  const sentCountBefore = alreadySent.size;
  let sent = 0;
  let failed = 0;

  for (let offset = 0; offset < recipients.length; offset += CAMPAIGN_BATCH_SIZE) {
    const batch = recipients.slice(offset, offset + CAMPAIGN_BATCH_SIZE);
    const messages = [];
    const tokens = new Map<string, string>();
    for (const subscriber of batch) {
      const token = randomBytes(32).toString("hex");
      tokens.set(subscriber.id, token);
      const unsubscribeUrl = `${ORIGIN()}/api/newsletter/unsubscribe?token=${token}&locale=${subscriber.locale}`;
      messages.push(await sendCampaignEmail({
        to: subscriber.email,
        subject: subscriber.locale === "fr" ? campaign.subject_fr : campaign.subject_en,
        body: subscriber.locale === "fr" ? campaign.body_fr : campaign.body_en,
        locale: subscriber.locale,
        unsubscribeUrl,
      }));
    }

    const pendingRows = batch.map((subscriber) => ({
      campaign_id: id.data,
      subscriber_id: subscriber.id,
      recipient_email: subscriber.email,
      status: "pending" as const,
    }));
    const { error: logError } = await admin
      .from("newsletter_campaign_deliveries")
      .upsert(pendingRows, { onConflict: "campaign_id,recipient_email", ignoreDuplicates: true });
    if (logError) {
      failed += batch.length;
      continue;
    }

    let unsubscribeTokenSaveFailed = false;
    for (const subscriber of batch) {
      const token = tokens.get(subscriber.id)!;
      const { error: tokenError } = await admin
        .from("newsletter_subscribers")
        .update({ unsubscribe_token_hash: hashToken(token) })
        .eq("id", subscriber.id);
      if (tokenError) unsubscribeTokenSaveFailed = true;
    }
    if (unsubscribeTokenSaveFailed) {
      failed += batch.length;
      await admin.from("newsletter_campaign_deliveries").upsert(
        batch.map((subscriber) => ({
          campaign_id: id.data,
          subscriber_id: subscriber.id,
          recipient_email: subscriber.email,
          status: "failed" as const,
          error_message: "Could not prepare the unsubscribe link.",
        })),
        { onConflict: "campaign_id,recipient_email" }
      );
      continue;
    }

    try {
      const resendIds = await sendEmailBatch(messages);
      const deliveryUpdates = batch.map((subscriber, index) => ({
        campaign_id: id.data,
        subscriber_id: subscriber.id,
        recipient_email: subscriber.email,
        status: "sent" as const,
        resend_email_id: resendIds[index] || null,
        sent_at: new Date().toISOString(),
        error_message: null,
      }));
      const { error: updateError } = await admin
        .from("newsletter_campaign_deliveries")
        .upsert(deliveryUpdates, { onConflict: "campaign_id,recipient_email" });
      if (updateError) failed += batch.length;
      else sent += batch.length;
    } catch (error) {
      console.error("[newsletter] campaign batch failed", error);
      failed += batch.length;
      await admin.from("newsletter_campaign_deliveries").upsert(
        batch.map((subscriber) => ({
          campaign_id: id.data,
          subscriber_id: subscriber.id,
          recipient_email: subscriber.email,
          status: "failed" as const,
          error_message: "Email provider rejected the batch.",
        })),
        { onConflict: "campaign_id,recipient_email" }
      );
    }
  }

  const finalSentCount = sentCountBefore + sent;
  const finalStatus = failed === 0 ? "sent" : "failed";
  await admin.from("newsletter_campaigns").update({
    status: finalStatus,
    recipient_count: subscribers.length,
    sent_count: finalSentCount,
    failed_count: failed,
    sent_at: failed === 0 ? new Date().toISOString() : null,
  }).eq("id", id.data);
  revalidatePath(`/${locale}/console/newsletter`);
  return { ok: failed === 0, sent: finalSentCount, failed, error: failed ? "partial" : undefined };
}
