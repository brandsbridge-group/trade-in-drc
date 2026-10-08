import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processCampaignBatch } from "@/lib/newsletter/send-queue";

/**
 * Background worker of the newsletter: finishes every campaign left in
 * `sending` (the console tab that started it was closed, a request timed out…).
 *
 * To be called on a schedule (every few minutes) by any scheduler that can send
 * `Authorization: Bearer <CRON_SECRET>` — Vercel Cron does it by itself once
 * the variable exists. Without `CRON_SECRET` the route answers 503 and sends
 * nothing; campaigns then only advance while a super-admin has the console open.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Stops claiming new batches after this long, to end well inside `maxDuration`. */
const TIME_BUDGET_MS = 40_000;

function authorized(request: NextRequest, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (!authorized(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from("newsletter_campaigns")
    .select("id")
    .eq("status", "sending")
    .order("updated_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not read campaigns" }, { status: 500 });

  let batches = 0;
  const finished: string[] = [];
  for (const campaign of campaigns ?? []) {
    while (Date.now() - startedAt < TIME_BUDGET_MS) {
      const progress = await processCampaignBatch(admin, campaign.id);
      batches += 1;
      if (progress.done) {
        finished.push(campaign.id);
        break;
      }
      // Temporary provider problem, or another worker holds what is left:
      // leave this campaign for the next run.
      if (progress.retryable || progress.claimed === 0) break;
    }
  }
  return NextResponse.json({ campaigns: campaigns?.length ?? 0, batches, finished });
}
