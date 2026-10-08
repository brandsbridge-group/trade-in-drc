/**
 * Outgoing e-mail, through Resend's HTTP API (no SDK: one POST). The ONLY
 * module that talks to the provider — transactional messages and newsletter
 * campaigns both go through it.
 *
 * Configuration via environment (server-only):
 *   - RESEND_API_KEY         the API key of the Resend account
 *   - EMAIL_FROM             sender of transactional e-mail, on a domain
 *                            verified in Resend,
 *                            e.g. "TradeInDRC <notifications@tradeindrc.com>"
 *   - NEWSLETTER_FROM_EMAIL  sender of the newsletter (optional)
 * Each sender falls back to the other one, so a single variable is enough.
 *
 * When the key or the sender is missing the send is SKIPPED and reported as
 * such — same approach as the CAPTCHA (`src/lib/messaging/captcha.ts`).
 * Callers must read the result and never tell a visitor "an e-mail was sent"
 * unless `sent` is true. A failed send is logged and never throws.
 *
 * Server-only module — never import it into a client component.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
/** Resend accepts at most 100 messages per batch call. */
export const EMAIL_BATCH_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 20_000;

export type EmailStream = "transactional" | "newsletter";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Extra message headers (List-Unsubscribe…). */
  headers?: Record<string, string>;
}

export interface EmailSendOptions {
  stream?: EmailStream;
  /**
   * Makes a repeated call safe: the provider answers a key it already accepted
   * (within 24 h, same content) with the first result instead of sending again.
   */
  idempotencyKey?: string;
}

export interface EmailResult {
  sent: boolean;
  /** Provider id of the message, when `sent` is true. */
  id?: string;
  /** Why nothing was sent, when `sent` is false. */
  reason?: "not_configured" | "provider_error";
}

export type EmailBatchResult =
  | { sent: true; ids: string[] }
  | {
      sent: false;
      reason: "not_configured" | "provider_error";
      /** True when the same call may succeed later (rate limit, outage, network). */
      retryable: boolean;
      detail?: string;
    };

/** The "From" of a stream, or null when no sender is configured. */
export function emailSender(stream: EmailStream = "transactional"): string | null {
  const transactional = process.env.EMAIL_FROM?.trim();
  const newsletter = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  return (stream === "newsletter" ? newsletter || transactional : transactional || newsletter) || null;
}

export function isEmailConfigured(stream: EmailStream = "transactional"): boolean {
  return Boolean(process.env.RESEND_API_KEY && emailSender(stream));
}

function payload(from: string, message: EmailMessage) {
  return {
    from,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(message.headers ? { headers: message.headers } : {}),
  };
}

async function post(url: string, apiKey: string, body: unknown, idempotencyKey?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function sendEmail(message: EmailMessage, options: EmailSendOptions = {}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = emailSender(options.stream);
  if (!apiKey || !from) return { sent: false, reason: "not_configured" };

  try {
    const response = await post(RESEND_ENDPOINT, apiKey, payload(from, message), options.idempotencyKey);
    if (!response.ok) {
      console.error("[sendEmail] provider refused the message:", response.status, await response.text().catch(() => ""));
      return { sent: false, reason: "provider_error" };
    }
    const result = (await response.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, id: result?.id };
  } catch (error) {
    console.error("[sendEmail]", error);
    return { sent: false, reason: "provider_error" };
  }
}

/**
 * Sends up to {@link EMAIL_BATCH_LIMIT} messages in one call; all are accepted
 * or none. `ids` follow the order of `messages`.
 */
export async function sendEmailBatch(
  messages: EmailMessage[],
  options: EmailSendOptions = {}
): Promise<EmailBatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = emailSender(options.stream);
  if (!apiKey || !from) return { sent: false, reason: "not_configured", retryable: false };
  if (messages.length === 0 || messages.length > EMAIL_BATCH_LIMIT) {
    return { sent: false, reason: "provider_error", retryable: false, detail: "Invalid batch size." };
  }

  try {
    const response = await post(
      RESEND_BATCH_ENDPOINT,
      apiKey,
      messages.map((message) => payload(from, message)),
      options.idempotencyKey
    );
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      console.error("[sendEmailBatch] provider refused the batch:", response.status, detail);
      return {
        sent: false,
        reason: "provider_error",
        retryable: response.status === 429 || response.status >= 500,
        detail: `Provider answered ${response.status}.`,
      };
    }
    const result = (await response.json().catch(() => null)) as { data?: Array<{ id?: string }> } | null;
    const ids = result?.data?.map((item) => item.id ?? "") ?? [];
    if (ids.length !== messages.length) {
      // Accepted, but the answer cannot be matched to the recipients: the same
      // call (same idempotency key) returns the stored answer again.
      return { sent: false, reason: "provider_error", retryable: true, detail: "Unreadable provider answer." };
    }
    return { sent: true, ids };
  } catch (error) {
    console.error("[sendEmailBatch]", error);
    return { sent: false, reason: "provider_error", retryable: true, detail: "Network error." };
  }
}

export { escapeHtml } from "./layout";
