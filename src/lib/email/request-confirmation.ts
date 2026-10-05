import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/locales";
import { escapeHtml, type EmailMessage } from "./send";

interface ConfirmationInput {
  locale: Locale;
  to: string;
  name: string;
  reference: string;
  /** One line saying what was asked ("Find a supplier — Cocoa beans"). */
  summary: string;
}

/** Address of the tracking page, with the reference already filled in. */
export function trackingUrl(locale: Locale, reference: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  return `${base}/${locale}/request/track?ref=${encodeURIComponent(reference)}`;
}

/**
 * "We received your request": the reference, what was asked, what happens next
 * and the link to follow it — in the language the visitor used on the site.
 */
export async function requestConfirmationEmail(input: ConfirmationInput): Promise<EmailMessage> {
  const t = await getTranslations({ locale: input.locale, namespace: "RequestEmail" });
  const url = trackingUrl(input.locale, input.reference);

  const greeting = t("greeting", { name: input.name });
  const lines = [t("received"), t("next"), t("keepReference")];

  const text = [
    greeting,
    "",
    lines[0],
    "",
    `${t("referenceLabel")}: ${input.reference}`,
    `${t("summaryLabel")}: ${input.summary}`,
    "",
    lines[1],
    lines[2],
    "",
    `${t("trackCta")}: ${url}`,
    "",
    t("signature"),
  ].join("\n");

  const cell = "padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;";
  const html = `<!doctype html>
<html lang="${input.locale}">
  <body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
          <tr><td style="background:#0B1F3A;padding:22px 26px;">
            <p style="margin:0;color:#E7C173;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">TradeInDRC</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:600;">${escapeHtml(t("title"))}</p>
          </td></tr>
          <tr><td style="padding:24px 26px 8px;">
            <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">${escapeHtml(lines[0])}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;">
              <tr><td style="${cell}color:#64748b;width:38%;">${escapeHtml(t("referenceLabel"))}</td><td style="${cell}font-family:Consolas,monospace;font-weight:700;color:#0B1F3A;">${escapeHtml(input.reference)}</td></tr>
              <tr><td style="${cell}border-bottom:0;color:#64748b;">${escapeHtml(t("summaryLabel"))}</td><td style="${cell}border-bottom:0;">${escapeHtml(input.summary)}</td></tr>
            </table>
            <p style="margin:16px 0 6px;font-size:14px;line-height:1.6;">${escapeHtml(lines[1])}</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">${escapeHtml(lines[2])}</p>
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#0B1F3A;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:999px;">${escapeHtml(t("trackCta"))}</a>
          </td></tr>
          <tr><td style="padding:20px 26px 24px;font-size:12px;color:#64748b;">${escapeHtml(t("signature"))}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { to: input.to, subject: t("subject", { reference: input.reference }), html, text };
}
