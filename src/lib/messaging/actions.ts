"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCaptchaToken } from "./captcha";
import { ensureThreadAndPostMessage } from "./threads";

/**
 * Secure messaging server actions (Requirements module 6 & 12).
 *
 * Every write path (start a conversation, send a message, report a message)
 * routes through here so the platform can enforce, server-side:
 *   1. Authentication  — only signed-in users may message (requireAuth-style).
 *   2. Rate limiting    — per-user sliding window counted against persisted
 *                         rows, so the limit survives across serverless calls.
 *   3. CAPTCHA          — pluggable provider (Cloudflare Turnstile by default);
 *                         skipped gracefully when CAPTCHA_SECRET_KEY is unset.
 *   4. Analytics        — a `contact_request` event is written for the first
 *                         message into a company so businesses see real counts.
 *
 * RLS still governs every row; these actions use the cookie-aware server client
 * so inserts run as the authenticated user. The service-role admin client is
 * used ONLY for the analytics_events insert (its RLS allows service-role only).
 */

// ---------------------------------------------------------------------------
// Constants — no magic numbers inline.
// ---------------------------------------------------------------------------
const SUBJECT_MAX = 200;
const MESSAGE_MIN = 1;
/** Mirrors the DB CHECK (messages_content_length_check) in migration 00012. */
const MESSAGE_MAX = 5000;
const REPORT_DETAILS_MAX = 1000;

/** Sliding-window rate limits, counted against persisted rows. */
const MESSAGE_RATE_LIMIT_MAX = 20;
const MESSAGE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 20 messages / hour / user
const CONVERSATION_RATE_LIMIT_MAX = 10;
const CONVERSATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 10 new threads / hour / user

const ANALYTICS_ENTITY_COMPANY = "company" as const;
const ANALYTICS_EVENT_CONTACT_REQUEST = "contact_request" as const;
const REPORT_STATUS_OPEN = "open" as const;

// ---------------------------------------------------------------------------
// Validation schemas — boundary validation with Zod.
// ---------------------------------------------------------------------------
const startConversationSchema = z.object({
  companyId: dbId(),
  companyOwnerId: dbId(),
  subject: z.string().trim().min(1).max(SUBJECT_MAX),
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
  captchaToken: z.string().optional().nullable(),
  /**
   * When the outreach originates from an Opportunities Board listing, this scopes
   * the thread to that opportunity (conversations.opportunity_id, migration 00025)
   * so a buyer can hold one thread per opportunity in addition to a company-level
   * thread. NULL/omitted = company-level thread.
   */
  opportunityId: dbId().optional().nullable(),
});

const sendMessageSchema = z.object({
  conversationId: dbId(),
  content: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
  captchaToken: z.string().optional().nullable(),
});

const reportMessageSchema = z.object({
  messageId: dbId(),
  conversationId: dbId(),
  reason: z.string().trim().min(1).max(120),
  details: z.string().trim().max(REPORT_DETAILS_MAX).optional().or(z.literal("")),
});

export type StartConversationInput = z.input<typeof startConversationSchema>;
export type SendMessageInput = z.input<typeof sendMessageSchema>;
export type ReportMessageInput = z.input<typeof reportMessageSchema>;

/** Machine-readable error codes so the UI can localize messages itself. */
export type MessagingErrorCode =
  | "not_authenticated"
  | "validation_failed"
  | "captcha_failed"
  | "rate_limited"
  | "self_message"
  | "not_participant"
  | "send_failed";

export interface StartConversationResult {
  success: boolean;
  conversationId?: string;
  errorCode?: MessagingErrorCode;
}

export interface SendMessageResult {
  success: boolean;
  errorCode?: MessagingErrorCode;
}

export interface ReportMessageResult {
  success: boolean;
  errorCode?: MessagingErrorCode | "report_failed";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || null;
}

/**
 * Counts the caller's recent rows in a window and returns whether they are over
 * the limit. Counting persisted rows (not an in-memory map) keeps the limit
 * correct across stateless serverless invocations.
 */
async function isOverMessageRateLimit(
  client: ReturnType<typeof createAdminClient>,
  senderId: string
): Promise<boolean> {
  const since = new Date(Date.now() - MESSAGE_RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await client
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", senderId)
    .gte("created_at", since);
  if (error) {
    // Fail closed on a count error: treat as over-limit to avoid a spam hole.
    return true;
  }
  return (count ?? 0) >= MESSAGE_RATE_LIMIT_MAX;
}

async function isOverConversationRateLimit(
  client: ReturnType<typeof createAdminClient>,
  initiatorId: string
): Promise<boolean> {
  const since = new Date(
    Date.now() - CONVERSATION_RATE_LIMIT_WINDOW_MS
  ).toISOString();
  const { count, error } = await client
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("initiator_id", initiatorId)
    .gte("created_at", since);
  if (error) {
    return true;
  }
  return (count ?? 0) >= CONVERSATION_RATE_LIMIT_MAX;
}

/** Writes a contact_request analytics event (service-role; RLS = SR-only insert). */
async function trackContactRequest(companyId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("analytics_events").insert({
    entity_type: ANALYTICS_ENTITY_COMPANY,
    entity_id: companyId,
    event_type: ANALYTICS_EVENT_CONTACT_REQUEST,
  });
}

// ---------------------------------------------------------------------------
// Action: start (or reuse) a conversation and send its first message.
// ---------------------------------------------------------------------------
export async function startConversation(
  input: StartConversationInput
): Promise<StartConversationResult> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errorCode: "validation_failed" };
  }
  const { companyId, companyOwnerId, subject, message, captchaToken, opportunityId } =
    parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return { success: false, errorCode: "not_authenticated" };
  }
  if (user.id === companyOwnerId) {
    return { success: false, errorCode: "self_message" };
  }

  const headerList = await headers();
  const captcha = await verifyCaptchaToken(captchaToken, clientIp(headerList));
  if (!captcha.ok) {
    return { success: false, errorCode: "captcha_failed" };
  }

  const admin = createAdminClient();
  if (
    (await isOverConversationRateLimit(admin, user.id)) ||
    (await isOverMessageRateLimit(admin, user.id))
  ) {
    return { success: false, errorCode: "rate_limited" };
  }

  const thread = await ensureThreadAndPostMessage({
    supabase,
    initiatorId: user.id,
    companyId,
    companyOwnerId,
    subject,
    message,
    opportunityId: opportunityId ?? null,
  });
  if (!thread) {
    return { success: false, errorCode: "send_failed" };
  }

  // Track contact intent only when a new thread is opened (one per company).
  if (thread.isNewConversation) {
    await trackContactRequest(companyId);
  }

  return { success: true, conversationId: thread.conversationId };
}

// ---------------------------------------------------------------------------
// Action: send a message into an existing conversation.
// ---------------------------------------------------------------------------
export async function sendMessage(
  input: SendMessageInput
): Promise<SendMessageResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errorCode: "validation_failed" };
  }
  const { conversationId, content, captchaToken } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return { success: false, errorCode: "not_authenticated" };
  }

  // Only a participant may post — verify membership before the insert.
  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { success: false, errorCode: "not_participant" };
  }

  const headerList = await headers();
  const captcha = await verifyCaptchaToken(captchaToken, clientIp(headerList));
  if (!captcha.ok) {
    return { success: false, errorCode: "captcha_failed" };
  }

  const admin = createAdminClient();
  if (await isOverMessageRateLimit(admin, user.id)) {
    return { success: false, errorCode: "rate_limited" };
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  });
  if (messageError) {
    return { success: false, errorCode: "send_failed" };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Action: report a message for abuse.
// ---------------------------------------------------------------------------
export async function reportMessage(
  input: ReportMessageInput
): Promise<ReportMessageResult> {
  const parsed = reportMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errorCode: "validation_failed" };
  }
  const { messageId, conversationId, reason, details } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return { success: false, errorCode: "not_authenticated" };
  }

  // RLS (message_reports_reporter_insert) re-checks participation; we surface a
  // clean error if the insert is rejected.
  const { error } = await supabase.from("message_reports").insert({
    message_id: messageId,
    conversation_id: conversationId,
    reporter_id: user.id,
    reason,
    details: details && details.length > 0 ? details : null,
    status: REPORT_STATUS_OPEN,
  });
  if (error) {
    return { success: false, errorCode: "report_failed" };
  }

  return { success: true };
}
