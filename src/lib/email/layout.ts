/**
 * The branded e-mail frame (logo, heading, paragraphs, optional details table,
 * button and unsubscribe line), as HTML plus its plain-text twin.
 *
 * Pure: no environment secret, no network — the console imports it to preview
 * a campaign exactly as it will be delivered. The sending side lives in
 * `send.ts`.
 */

const BRAND_NAVY = "#0B1F3A";
const BRAND_BLUE = "#0878C9";
const LOGO_PATH = "/images/brand/logo-color.png";

export type EmailLocale = "en" | "fr";

export interface EmailLayoutInput {
  locale: EmailLocale;
  /**
   * Origin the logo is loaded from ("https://…"). An empty string gives a
   * site-relative address: right for the in-page preview, never for a real send.
   */
  origin: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  details?: Array<[string, string]>;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
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

function paragraphHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;color:#475569">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function renderEmailLayout(input: EmailLayoutInput): RenderedEmail {
  const fr = input.locale === "fr";
  const logoUrl = `${input.origin}${LOGO_PATH}`;
  const preheader = escapeHtml(input.preheader);
  const paragraphs = input.paragraphs.map(paragraphHtml).join("");
  const details = input.details?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0">${input.details
        .map(([label, value]) => `<tr><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:34%">${escapeHtml(label)}</td><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;color:${BRAND_NAVY};font-size:13px;font-weight:600">${escapeHtml(value)}</td></tr>`)
        .join("")}</table>`
    : "";
  const cta = input.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="border-radius:9px;background:${BRAND_BLUE}"><a href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:9px;font-size:14px">${escapeHtml(input.cta.label)}</a></td></tr></table>`
    : "";
  const unsubscribe = input.unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#94a3b8">${fr ? "Vous recevez cet e-mail car vous avez confirmé votre inscription à la newsletter TradeInDRC." : "You are receiving this email because you confirmed your TradeInDRC newsletter subscription."}<br><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#64748b">${fr ? "Se désabonner" : "Unsubscribe"}</a></p>`
    : "";
  const legal = fr
    ? "Plateforme officielle de mise en relation commerciale de la République démocratique du Congo."
    : "The official trade connection platform of the Democratic Republic of the Congo.";

  const text = [
    input.heading,
    ...input.paragraphs,
    ...(input.details ?? []).map(([label, value]) => `${label}: ${value}`),
    ...(input.cta ? [`${input.cta.label}: ${input.cta.href}`] : []),
    ...(input.unsubscribeUrl ? [`${fr ? "Se désabonner" : "Unsubscribe"}: ${input.unsubscribeUrl}`] : []),
    legal,
  ].join("\n\n");

  return {
    text,
    html: `<!doctype html><html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(input.heading)}</title></head><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:${BRAND_NAVY};-webkit-font-smoothing:antialiased"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f3f6fa"><tr><td align="center" style="padding:36px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4eaf2;border-radius:16px;overflow:hidden"><tr><td style="padding:22px 30px;background:#ffffff;border-bottom:1px solid #e8edf4"><img src="${escapeHtml(logoUrl)}" alt="TradeInDRC" width="176" style="display:block;width:176px;max-width:100%;height:auto;border:0"></td></tr><tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND_BLUE}">&nbsp;</td></tr><tr><td style="padding:34px 34px 30px"><h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;color:${BRAND_NAVY}">${escapeHtml(input.heading)}</h1>${paragraphs}${details}${cta}${unsubscribe}</td></tr><tr><td style="padding:18px 30px;background:#f7f9fc;border-top:1px solid #e8edf4;color:#718096;font-size:11px;line-height:1.65">${escapeHtml(legal)}<br><span style="color:#9aa8b8">TradeInDRC</span></td></tr></table></td></tr></table></body></html>`,
  };
}
