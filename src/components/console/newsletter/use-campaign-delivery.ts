"use client";

import { useEffect, useRef, useState } from "react";
import { processNewsletterCampaign } from "@/lib/newsletter/campaign-actions";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";
import type { CampaignProgress } from "@/lib/newsletter/send-queue";

/**
 * `running`: batches are going out. `waiting`: the provider answered "later",
 * the same batch is tried again shortly. `stalled`: it kept failing — the user
 * resumes by hand (or the cron route picks the campaign up).
 */
export type DeliveryState = "idle" | "running" | "waiting" | "stalled";

export interface DeliveryCounts {
  sent: number;
  failed: number;
  total: number;
}

/** Consecutive troubled calls before the page stops trying by itself. */
const MAX_TROUBLE = 4;
/** Pause when another worker holds the remaining batches. */
const IDLE_PAUSE_MS = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Deliverable = Pick<NewsletterCampaign, "id" | "status" | "sent_count" | "failed_count" | "recipient_count">;

/**
 * Drives a campaign in `sending` from the open page: asks the server for one
 * batch after the other and exposes live counts. Opening the console is enough
 * to resume a campaign whose tab was closed mid-send; the database makes sure
 * two open tabs never send the same batch.
 */
export function useCampaignDelivery(
  locale: string,
  campaign: Deliverable,
  onDone: (progress: CampaignProgress) => void
) {
  const [liveCounts, setLiveCounts] = useState<DeliveryCounts | null>(null);
  const [phase, setPhase] = useState<Exclude<DeliveryState, "idle">>("running");
  const [run, setRun] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const sending = campaign.status === "sending";
  const campaignId = campaign.id;

  useEffect(() => {
    if (!sending) return;
    let cancelled = false;

    void (async () => {
      let trouble = 0;
      while (!cancelled) {
        let progress: CampaignProgress | null = null;
        try {
          progress = await processNewsletterCampaign(locale, campaignId);
        } catch {
          // Network or server hiccup: counted as trouble below.
        }
        if (cancelled) return;

        if (!progress || progress.retryable) {
          trouble += 1;
          if (trouble >= MAX_TROUBLE) {
            setPhase("stalled");
            return;
          }
          setPhase("waiting");
          await sleep(2000 * trouble);
          continue;
        }

        trouble = 0;
        setPhase("running");
        setLiveCounts({ sent: progress.sent, failed: progress.failed, total: progress.total });
        if (progress.done) {
          onDoneRef.current(progress);
          return;
        }
        if (progress.claimed === 0) await sleep(IDLE_PAUSE_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sending, campaignId, locale, run]);

  const counts: DeliveryCounts =
    (sending && liveCounts) || {
      sent: campaign.sent_count,
      failed: campaign.failed_count,
      total: campaign.recipient_count,
    };
  const state: DeliveryState = sending ? phase : "idle";

  return {
    counts,
    state,
    resume: () => {
      setPhase("running");
      setRun((n) => n + 1);
    },
  };
}
