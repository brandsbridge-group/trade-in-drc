import "server-only";

const BRAND_NAVY = "#0B1F3A";
const BRAND_GOLD = "#CBA14E";

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
}

export interface EventReceiptDetails {
  eventName: string;
  eventType: string;
  date: string;
  location: string;
  organizer: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function paragraphHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.7;color:#475569">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function emailLayout(input: {
  preheader: string;
  heading: string;
  paragraphs: string[];
  details?: Array<[string, string]>;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
  locale: "en" | "fr";
}): { html: string; text: string } {
  const preheader = escapeHtml(input.preheader);
  const paragraphs = input.paragraphs.map(paragraphHtml).join("");
  const details = input.details?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0">${input.details
        .map(([label, value]) => `<tr><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:34%">${escapeHtml(label)}</td><td style="padding:11px 14px;border-bottom:1px solid #e2e8f0;color:${BRAND_NAVY};font-size:13px;font-weight:600">${escapeHtml(value)}</td></tr>`)
        .join("")}</table>`
    : "";
  const cta = input.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(input.cta.href)}" style="display:inline-block;background:${BRAND_GOLD};color:${BRAND_NAVY};font-weight:700;text-decoration:none;padding:13px 20px;border-radius:5px">${escapeHtml(input.cta.label)}</a></p>`
    : "";
  const unsubscribe = input.unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#94a3b8">${input.locale === "fr" ? "Vous recevez cet e-mail car vous avez confirmé votre inscription à la newsletter TradeInDRC." : "You are receiving this email because you confirmed your TradeInDRC newsletter subscription."}<br><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#64748b">${input.locale === "fr" ? "Se désabonner" : "Unsubscribe"}</a></p>`
    : "";
  const legal = input.locale === "fr"
    ? "Plateforme officielle de mise en relation commerciale de la République démocratique du Congo."
    : "The official trade connection platform of the Democratic Republic of the Congo.";
  const text = [input.heading, ...input.paragraphs, ...(input.details ?? []).map(([label, value]) => `${label}: ${value}`), ...(input.cta ? [`${input.cta.label}: ${input.cta.href}`] : []), ...(input.unsubscribeUrl ? [input.locale === "fr" ? `Se désabonner: ${input.unsubscribeUrl}` : `Unsubscribe: ${input.unsubscribeUrl}`] : []), legal].join("\n\n");

  return {
    text,
    html: `<!doctype html><html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.heading)}</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:${BRAND_NAVY}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div><table role="presentation" style="width:100%;border-collapse:collapse;background:#f1f5f9"><tr><td align="center" style="padding:32px 12px"><table role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0"><tr><td style="background:${BRAND_NAVY};padding:23px 30px;border-bottom:4px solid ${BRAND_GOLD}"><div style="font-size:19px;line-height:1.2;font-weight:700;letter-spacing:.3px;color:#ffffff">TradeInDRC</div><div style="margin-top:5px;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#cbd5e1">Trade. Connect. Grow.</div></td></tr><tr><td style="padding:32px 30px 24px"><h1 style="margin:0 0 20px;font-size:23px;line-height:1.3;color:${BRAND_NAVY}">${escapeHtml(input.heading)}</h1>${paragraphs}${details}${cta}${unsubscribe}</td></tr><tr><td style="padding:17px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;line-height:1.6">${escapeHtml(legal)}<br>TradeInDRC</td></tr></table></td></tr></table></body></html>`,
  };
}

export async function sendEmail(content: EmailContent): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [content.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!response.ok || !result?.id) {
    throw new Error(`Email provider request failed (${response.status}).`);
  }
  return result.id;
}

export async function sendEventReceiptEmail(
  to: string,
  details: EventReceiptDetails,
  locale: "en" | "fr"
): Promise<void> {
  const fr = locale === "fr";
  const content = emailLayout({
    locale,
    preheader: fr ? "Votre événement est enregistré et en cours d'examen." : "Your event has been recorded and is under review.",
    heading: fr ? "Votre événement a bien été enregistré" : "Your event has been received",
    paragraphs: fr
      ? ["Bonjour,", "Nous avons bien reçu votre proposition d'événement. Elle est enregistrée et notre équipe procède à son examen avant publication. Nous vous recontacterons à l'adresse indiquée si nous avons besoin d'informations complémentaires ou lorsque le traitement aura avancé.", "Merci de contribuer à la visibilité des opportunités professionnelles en République démocratique du Congo."]
      : ["Hello,", "We have received your event submission. It has been recorded and our team is reviewing it before publication. We will contact you at the address provided if additional information is required or when the review progresses.", "Thank you for helping showcase business opportunities in the Democratic Republic of the Congo."],
    details: [
      [fr ? "Événement" : "Event", details.eventName],
      [fr ? "Type" : "Type", details.eventType],
      [fr ? "Date" : "Date", details.date],
      [fr ? "Lieu" : "Location", details.location],
      [fr ? "Organisateur" : "Organizer", details.organizer],
    ],
  });
  await sendEmail({
    to,
    subject: fr ? "TradeInDRC | Confirmation de réception de votre événement" : "TradeInDRC | Event submission received",
    ...content,
  });
}

export async function sendNewsletterConfirmationEmail(
  to: string,
  confirmUrl: string,
  unsubscribeUrl: string,
  locale: "en" | "fr"
): Promise<void> {
  const fr = locale === "fr";
  const content = emailLayout({
    locale,
    preheader: fr ? "Confirmez votre adresse pour recevoir la newsletter TradeInDRC." : "Confirm your address to receive the TradeInDRC newsletter.",
    heading: fr ? "Confirmez votre inscription" : "Confirm your subscription",
    paragraphs: fr
      ? ["Bonjour,", "Une demande d'inscription à la newsletter TradeInDRC a été faite avec cette adresse. Pour confirmer votre choix et recevoir nos actualités commerciales, veuillez confirmer votre adresse ci-dessous.", "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message; aucune inscription ne sera activée sans confirmation."]
      : ["Hello,", "A request was made to subscribe this address to the TradeInDRC newsletter. To confirm your choice and receive our trade updates, please confirm your address below.", "If you did not make this request, you can ignore this email; no subscription will be activated without confirmation."],
    cta: { label: fr ? "Confirmer mon adresse e-mail" : "Confirm my email address", href: confirmUrl },
    unsubscribeUrl,
  });
  await sendEmail({
    to,
    subject: fr ? "TradeInDRC | Confirmez votre inscription" : "TradeInDRC | Confirm your subscription",
    ...content,
  });
}

export async function sendCampaignEmail(input: {
  to: string;
  subject: string;
  body: string;
  locale: "en" | "fr";
  unsubscribeUrl: string;
}): Promise<EmailContent> {
  const content = emailLayout({
    locale: input.locale,
    preheader: input.subject,
    heading: input.subject,
    paragraphs: [input.body],
    unsubscribeUrl: input.unsubscribeUrl,
  });
  return { to: input.to, subject: input.subject, unsubscribeUrl: input.unsubscribeUrl, ...content };
}

export async function sendEmailBatch(contents: EmailContent[]): Promise<string[]> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email provider is not configured.");
  if (contents.length === 0 || contents.length > 100) {
    throw new Error("Email batch must contain between 1 and 100 messages.");
  }

  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contents.map((content) => ({
      from,
      to: [content.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
      ...(content.unsubscribeUrl
        ? { headers: { "List-Unsubscribe": `<${content.unsubscribeUrl}>` } }
        : {}),
    }))),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as
    | { data?: Array<{ id?: string }>; message?: string }
    | null;

  if (
    !response.ok ||
    !result?.data ||
    result.data.length !== contents.length ||
    result.data.some((item) => !item.id)
  ) {
    throw new Error(`Email batch request failed (${response.status}).`);
  }
  return result.data.map((item) => item.id ?? "");
}
