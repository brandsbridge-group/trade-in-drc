import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmailBatch, type EmailMessage } from "@/lib/email/send";
import { siteOrigin } from "@/lib/site-url";
import type { Database } from "@/lib/supabase/types";
import { renderCampaignEmail, type NewsletterCampaign } from "./campaign-email";
import { unsubscribeUrl } from "./tokens";

/**
 * The sending side of a campaign (queue described in migration 00069).
 *
 * One call = one batch: claim it, send it, write the outcome, recount the
 * campaign. Whoever calls in a loop is the worker — the console page while it
 * is open, and the cron route (`/api/cron/newsletter`) for the rest. Several
 * workers can run at once: the database never hands the same batch twice.
 */

type Admin = SupabaseClient<Database>;

/** Seconds after which a claimed batch nobody closed is handed out again. */
const STALE_CLAIM_SECONDS = 120;

interface ClaimedDelivery {
  delivery_id: string;
  subscriber_id: string;
  recipient_email: string;
  locale: "en" | "fr";
  batch_no: number;
  attempt: number;
}

export interface CampaignProgress {
  status: NewsletterCampaign["status"];
  total: number;
  sent: number;
  failed: number;
  /** Nothing left to send: the campaign is `sent` or `failed`. */
  done: boolean;
  /** The last batch hit a temporary provider problem and went back to the queue. */
  retryable: boolean;
  /**
   * Deliveries this call took from the queue. 0 while the campaign is not done
   * means another worker holds the remaining batches: wait before calling again.
   */
  claimed: number;
}

function progressOf(campaign: NewsletterCampaign, claimed = 0, retryable = false): CampaignProgress {
  return {
    status: campaign.status,
    total: campaign.recipient_count,
    sent: campaign.sent_count,
    failed: campaign.failed_count,
    done: campaign.status !== "sending",
    retryable,
    claimed,
  };
}

async function refresh(admin: Admin, campaignId: string): Promise<NewsletterCampaign> {
  const { data, error } = await admin.rpc("newsletter_refresh_campaign", { p_campaign_id: campaignId });
  if (error || !data) throw new Error(`[newsletter] could not recount campaign ${campaignId}: ${error?.message}`);
  return data as NewsletterCampaign;
}

/** Sends the next batch of a campaign, if any, and returns where the campaign stands. */
export async function processCampaignBatch(admin: Admin, campaignId: string): Promise<CampaignProgress> {
  const { data: campaign, error: campaignError } = await admin
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign) throw new Error(`[newsletter] campaign ${campaignId} not found`);
  if (campaign.status !== "sending") return progressOf(campaign);

  const { data: claimed, error: claimError } = await admin.rpc("newsletter_claim_batch", {
    p_campaign_id: campaignId,
    p_stale_seconds: STALE_CLAIM_SECONDS,
  });
  if (claimError) throw new Error(`[newsletter] could not claim a batch: ${claimError.message}`);

  // Sorted so a batch sent twice has the very same content (idempotency key).
  const batch = ((claimed ?? []) as ClaimedDelivery[]).sort((a, b) => a.recipient_email.localeCompare(b.recipient_email));
  if (batch.length === 0) return progressOf(await refresh(admin, campaignId));

  const ids = batch.map((delivery) => delivery.delivery_id);
  const deliveries = () => admin.from("newsletter_campaign_deliveries");

  let origin: string;
  try {
    origin = siteOrigin();
  } catch (error) {
    console.error("[newsletter]", error);
    await deliveries().update({ status: "failed", error_message: "Site address is not configured." }).in("id", ids);
    return progressOf(await refresh(admin, campaignId), batch.length);
  }

  const messages: EmailMessage[] = batch.map((delivery) => {
    const french = delivery.locale === "fr";
    const unsubscribe = unsubscribeUrl(origin, delivery.subscriber_id, delivery.locale);
    const subject = french ? campaign.subject_fr : campaign.subject_en;
    return {
      to: delivery.recipient_email,
      subject,
      ...renderCampaignEmail({
        language: delivery.locale,
        subject,
        body: french ? campaign.body_fr : campaign.body_en,
        origin,
        unsubscribeUrl: unsubscribe,
      }),
      // One-click unsubscribe (RFC 8058), required by Gmail and Yahoo from bulk senders.
      headers: {
        "List-Unsubscribe": `<${unsubscribe}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  const { batch_no: batchNo } = batch[0];
  const attempt = Math.max(...batch.map((delivery) => delivery.attempt));
  const result = await sendEmailBatch(messages, {
    stream: "newsletter",
    idempotencyKey: `newsletter/${campaignId}/${batchNo}/${attempt}`,
  });

  if (result.sent) {
    const sentAt = new Date().toISOString();
    // One write for the batch (each row carries its own provider id).
    const { error: logError } = await deliveries().upsert(
      batch.map((delivery, index) => ({
        id: delivery.delivery_id,
        campaign_id: campaignId,
        subscriber_id: delivery.subscriber_id,
        recipient_email: delivery.recipient_email,
        batch_no: delivery.batch_no,
        attempt: delivery.attempt,
        status: "sent" as const,
        resend_email_id: result.ids[index] || null,
        sent_at: sentAt,
        error_message: null,
      })),
      { onConflict: "id" }
    );
    // Rows that could not be written stay `sending`: the batch is claimed
    // again later and the provider, given the same key, does not send twice.
    if (logError) console.error("[newsletter] delivery log not written for batch", batchNo, logError.code);
    return progressOf(await refresh(admin, campaignId), batch.length);
  }

  if (result.retryable) {
    await deliveries().update({ status: "pending", claimed_at: null }).in("id", ids);
    return progressOf(await refresh(admin, campaignId), batch.length, true);
  }

  await deliveries()
    .update({ status: "failed", error_message: result.detail ?? "Email provider rejected the batch." })
    .in("id", ids);
  return progressOf(await refresh(admin, campaignId), batch.length);
}
