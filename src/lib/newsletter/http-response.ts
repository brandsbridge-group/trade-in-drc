import { NextResponse } from "next/server";

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

export function newsletterNotice(
  locale: "en" | "fr",
  state: "confirmed" | "unsubscribed" | "invalid"
) {
  const copy = {
    en: {
      confirmed: ["Subscription confirmed", "You are now subscribed to TradeInDRC newsletter updates."],
      unsubscribed: ["You have been unsubscribed", "You will no longer receive TradeInDRC newsletter campaigns."],
      invalid: ["This link is no longer valid", "It may have already been used or expired. You can manage your subscription from a recent email."],
    },
    fr: {
      confirmed: ["Inscription confirmée", "Votre adresse est maintenant inscrite à la newsletter TradeInDRC."],
      unsubscribed: ["Désinscription effectuée", "Vous ne recevrez plus les campagnes de la newsletter TradeInDRC."],
      invalid: ["Ce lien n'est plus valide", "Il a peut-être déjà été utilisé ou a expiré. Vous pouvez gérer votre inscription depuis un e-mail récent."],
    },
  } as const;
  const [title, body] = copy[locale][state];
  const back = locale === "fr" ? "Retour aux événements" : "Back to events";
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | TradeInDRC</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0B1F3A"><main style="max-width:560px;margin:8vh auto;padding:0 16px"><section style="background:white;border:1px solid #e2e8f0"><header style="padding:22px 28px;background:#0B1F3A;border-bottom:4px solid #CBA14E;color:white;font-weight:700;font-size:19px">TradeInDRC</header><div style="padding:32px 28px"><h1 style="margin:0 0 14px;font-size:24px">${escapeHtml(title)}</h1><p style="margin:0 0 24px;color:#475569;line-height:1.7">${escapeHtml(body)}</p><a href="/${locale}/events" style="display:inline-block;padding:12px 18px;background:#CBA14E;color:#0B1F3A;text-decoration:none;font-weight:700">${escapeHtml(back)}</a></div></section></main></body></html>`;
  return new NextResponse(html, {
    status: state === "invalid" ? 400 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function newsletterActionForm(
  locale: "en" | "fr",
  token: string,
  action: "confirm" | "unsubscribe"
) {
  const copy = {
    en: {
      confirm: ["Confirm your newsletter subscription", "Confirm that you want to receive TradeInDRC newsletter updates.", "Confirm subscription"],
      unsubscribe: ["Unsubscribe from the newsletter", "Confirm that you no longer want to receive TradeInDRC newsletter campaigns.", "Unsubscribe"],
    },
    fr: {
      confirm: ["Confirmez votre inscription à la newsletter", "Confirmez que vous souhaitez recevoir la newsletter TradeInDRC.", "Confirmer mon inscription"],
      unsubscribe: ["Se désabonner de la newsletter", "Confirmez que vous ne souhaitez plus recevoir les campagnes de la newsletter TradeInDRC.", "Me désabonner"],
    },
  } as const;
  const [title, body, button] = copy[locale][action];
  const endpoint = action === "confirm" ? "confirm" : "unsubscribe";
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | TradeInDRC</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0B1F3A"><main style="max-width:560px;margin:8vh auto;padding:0 16px"><section style="background:#fff;border:1px solid #e2e8f0"><header style="padding:22px 28px;background:#0B1F3A;border-bottom:4px solid #CBA14E;color:#fff;font-weight:700;font-size:19px">TradeInDRC</header><div style="padding:32px 28px"><h1 style="margin:0 0 14px;font-size:24px">${escapeHtml(title)}</h1><p style="margin:0 0 24px;color:#475569;line-height:1.7">${escapeHtml(body)}</p><form method="post" action="/api/newsletter/${endpoint}"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="locale" value="${locale}"><button type="submit" style="border:0;padding:13px 20px;background:#CBA14E;color:#0B1F3A;font-weight:700;cursor:pointer">${escapeHtml(button)}</button></form></div></section></main></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
