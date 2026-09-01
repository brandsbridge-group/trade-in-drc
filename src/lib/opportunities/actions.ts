"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCaptchaToken } from "@/lib/messaging/captcha";
import { ensureThreadAndPostMessage } from "@/lib/messaging/threads";

/**
 * Opportunities Board response loop (Req 13, work package O1b).
 *
 * A signed-in, email-verified buyer responds to a published opportunity. The
 * response is persisted in `opportunity_responses` AND opens (or reuses) a
 * conversation thread scoped to the opportunity, so the poster can follow up via
 * the secure inbox. RLS (`opportunity_responses_responder_insert`, migration
 * 00021) is the authoritative gate — it re-checks email verification and blocks
 * responding to your own company's opportunity. We mirror those checks here so
 * the UI gets a clean error code instead of a raw RLS rejection.
 */

const RESPONSE_MIN = 1;
/** Mirrors the DB CHECK (messages_content_length_check) in migration 00012. */
const RESPONSE_MAX = 5000;
/** Default subject for the opportunity-scoped thread when the body is long. */
const SUBJECT_MAX = 200;

/** Sliding-window rate limit for new threads, shared intent with messaging. */
const RESPONSE_RATE_LIMIT_MAX = 10;
const RESPONSE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const respondSchema = z.object({
  opportunityId: dbId(),
  message: z.string().trim().min(RESPONSE_MIN).max(RESPONSE_MAX),
  captchaToken: z.string().optional().nullable(),
});

export type RespondToOpportunityInput = z.input<typeof respondSchema>;

export type OpportunityResponseErrorCode =
  | "not_authenticated"
  | "email_not_verified"
  | "validation_failed"
  | "captcha_failed"
  | "rate_limited"
  | "self_response"
  | "opportunity_unavailable"
  | "submit_failed";

export interface RespondToOpportunityResult {
  success: boolean;
  conversationId?: string;
  errorCode?: OpportunityResponseErrorCode;
}

function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || null;
}

async function isOverResponseRateLimit(
  client: ReturnType<typeof createAdminClient>,
  responderId: string
): Promise<boolean> {
  const since = new Date(
    Date.now() - RESPONSE_RATE_LIMIT_WINDOW_MS
  ).toISOString();
  const { count, error } = await client
    .from("opportunity_responses")
    .select("id", { count: "exact", head: true })
    .eq("responder_id", responderId)
    .gte("created_at", since);
  if (error) {
    // Fail closed on a count error to avoid a spam hole.
    return true;
  }
  return (count ?? 0) >= RESPONSE_RATE_LIMIT_MAX;
}

/**
 * Submit a response to a published opportunity, persisting it and linking a
 * conversation thread for follow-up. The conversation is opportunity-scoped so
 * it threads independently of any company-level chat (migration 00025).
 */
export async function insertOpportunityResponse(
  input: RespondToOpportunityInput
): Promise<RespondToOpportunityResult> {
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errorCode: "validation_failed" };
  }
  const { opportunityId, message, captchaToken } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return { success: false, errorCode: "not_authenticated" };
  }
  // Mirror the RLS is_email_verified() gate for a clean, actionable error.
  if (!user.email_confirmed_at) {
    return { success: false, errorCode: "email_not_verified" };
  }

  const headerList = await headers();
  const captcha = await verifyCaptchaToken(captchaToken, clientIp(headerList));
  if (!captcha.ok) {
    return { success: false, errorCode: "captcha_failed" };
  }

  // Resolve the opportunity's company + owner. Only published opportunities are
  // respondable; getting the owner lets us add them as a thread participant.
  const { data: op, error: opError } = await supabase
    .from("opportunities")
    .select("id, company_id, title_en, title_fr, status, companies(owner_id)")
    .eq("id", opportunityId)
    .eq("status", "published")
    .maybeSingle();
  if (opError) {
    return { success: false, errorCode: "submit_failed" };
  }
  if (!op) {
    return { success: false, errorCode: "opportunity_unavailable" };
  }

  const opportunity = op as unknown as {
    id: string;
    company_id: string;
    title_en: string;
    title_fr: string;
    companies: { owner_id: string } | null;
  };
  const ownerId = opportunity.companies?.owner_id;
  if (!ownerId) {
    return { success: false, errorCode: "opportunity_unavailable" };
  }
  // Cannot respond to your own company's opportunity (mirrors RLS WITH CHECK).
  if (ownerId === user.id) {
    return { success: false, errorCode: "self_response" };
  }

  const admin = createAdminClient();
  if (await isOverResponseRateLimit(admin, user.id)) {
    return { success: false, errorCode: "rate_limited" };
  }

  // Open (or reuse) the opportunity-scoped thread and post the response as its
  // first message. Reuses the messaging thread primitive — no duplication.
  const subject = opportunity.title_en.slice(0, SUBJECT_MAX);
  const thread = await ensureThreadAndPostMessage({
    supabase,
    initiatorId: user.id,
    companyId: opportunity.company_id,
    companyOwnerId: ownerId,
    subject,
    message,
    opportunityId: opportunity.id,
  });
  if (!thread) {
    return { success: false, errorCode: "submit_failed" };
  }

  // Persist the response row, linked to the thread for poster-side follow-up.
  // The responder responds as a buyer (no company_id) — the RLS insert policy
  // only allows a company_id you own, which a responder generally is not.
  const { error: responseError } = await supabase
    .from("opportunity_responses")
    .insert({
      opportunity_id: opportunity.id,
      responder_id: user.id,
      company_id: null,
      message,
      conversation_id: thread.conversationId,
    });
  if (responseError) {
    return { success: false, errorCode: "submit_failed" };
  }

  return { success: true, conversationId: thread.conversationId };
}
