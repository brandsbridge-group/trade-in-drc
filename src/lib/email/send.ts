/**
 * Transactional e-mail, through Resend's HTTP API (no SDK: one POST).
 *
 * Configuration via environment (server-only):
 *   - RESEND_API_KEY   the API key of the Resend account
 *   - EMAIL_FROM       the sender, on a domain verified in Resend,
 *                      e.g. "TradeInDRC <notifications@tradeindrc.com>"
 *
 * When either is missing the send is SKIPPED and reported as such — same
 * approach as the CAPTCHA (`src/lib/messaging/captcha.ts`). Callers must read
 * the result and never tell a visitor "an e-mail was sent" unless `sent` is
 * true. A failed send is logged and never breaks the action that triggered it.
 *
 * Server-only module — never import it into a client component.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  sent: boolean;
  /** Why nothing was sent, when `sent` is false. */
  reason?: "not_configured" | "provider_error";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { sent: false, reason: "not_configured" };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    });
    if (!response.ok) {
      console.error("[sendEmail] provider refused the message:", response.status, await response.text().catch(() => ""));
      return { sent: false, reason: "provider_error" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[sendEmail]", error);
    return { sent: false, reason: "provider_error" };
  }
}

/** Escapes a value placed in an HTML e-mail body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
