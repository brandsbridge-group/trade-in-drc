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
  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://tradeindrc.net").replace(/\/+$/, "");
  const logoUrl = `${siteOrigin}/images/brand/logo-color.png`;

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
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(t("title"))}</title></head>
  <body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#0B1F3A;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa;padding:36px 14px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4eaf2;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#ffffff;padding:22px 30px;border-bottom:1px solid #e8edf4;">
            <img src="${escapeHtml(logoUrl)}" alt="TradeInDRC" width="176" style="display:block;width:176px;max-width:100%;height:auto;border:0;">
          </td></tr>
          <tr><td style="height:3px;line-height:3px;font-size:0;background:#0878C9;">&nbsp;</td></tr>
          <tr><td style="padding:32px 34px 30px;">
            <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;color:#0B1F3A;">${escapeHtml(t("title"))}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(greeting)}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(lines[0])}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1px solid #e8edf4;border-radius:10px;">
              <tr><td style="${cell}color:#64748b;width:38%;">${escapeHtml(t("referenceLabel"))}</td><td style="${cell}font-family:Consolas,monospace;font-weight:700;color:#0B1F3A;">${escapeHtml(input.reference)}</td></tr>
              <tr><td style="${cell}border-bottom:0;color:#64748b;">${escapeHtml(t("summaryLabel"))}</td><td style="${cell}border-bottom:0;color:#0B1F3A;">${escapeHtml(input.summary)}</td></tr>
            </table>
            <p style="margin:16px 0 6px;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(lines[1])}</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(lines[2])}</p>
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#0878C9;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 22px;border-radius:9px;">${escapeHtml(t("trackCta"))}</a>
          </td></tr>
          <tr><td style="padding:18px 30px;background:#f7f9fc;border-top:1px solid #e8edf4;font-size:12px;line-height:1.6;color:#718096;">${escapeHtml(t("signature"))}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { to: input.to, subject: t("subject", { reference: input.reference }), html, text };
}
