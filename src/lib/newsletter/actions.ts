"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmailLayout } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { siteOrigin } from "@/lib/site-url";
import { hashToken, unsubscribeUrl } from "./tokens";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(["en", "fr"]).default("en"),
  consent: z.literal(true),
});

export interface NewsletterActionResult {
  ok: boolean;
  error?: "invalid" | "email_unavailable";
  alreadySubscribed?: boolean;
}

function confirmationEmail(locale: "en" | "fr", origin: string, confirmUrl: string, unsubscribe: string) {
  const fr = locale === "fr";
  return {
    subject: fr ? "TradeInDRC | Confirmez votre inscription" : "TradeInDRC | Confirm your subscription",
    ...renderEmailLayout({
      locale,
      origin,
      preheader: fr ? "Confirmez votre adresse pour recevoir la newsletter TradeInDRC." : "Confirm your address to receive the TradeInDRC newsletter.",
      heading: fr ? "Confirmez votre inscription" : "Confirm your subscription",
      paragraphs: fr
        ? ["Bonjour,", "Une demande d'inscription à la newsletter TradeInDRC a été faite avec cette adresse. Pour confirmer votre choix et recevoir nos actualités commerciales, veuillez confirmer votre adresse ci-dessous.", "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message; aucune inscription ne sera activée sans confirmation."]
        : ["Hello,", "A request was made to subscribe this address to the TradeInDRC newsletter. To confirm your choice and receive our trade updates, please confirm your address below.", "If you did not make this request, you can ignore this email; no subscription will be activated without confirmation."],
      cta: { label: fr ? "Confirmer mon adresse e-mail" : "Confirm my email address", href: confirmUrl },
      unsubscribeUrl: unsubscribe,
    }),
  };
}

export async function subscribeToNewsletter(input: {
  email: string;
  locale: string;
  consent: boolean;
}): Promise<NewsletterActionResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const email = parsed.data.email.toLowerCase();
  const locale = parsed.data.locale;

  // Resolved before anything is written: without a public address the links of
  // the confirmation e-mail would be dead, so the subscription is refused.
  let origin: string;
  try {
    origin = siteOrigin();
  } catch (error) {
    console.error("[newsletter]", error);
    return { ok: false, error: "email_unavailable" };
  }

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("newsletter_subscribers")
    .select("id, status, subscribed_at")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) return { ok: false, error: "email_unavailable" };

  if (existing?.status === "active") return { ok: true, alreadySubscribed: true };
  if (existing?.status === "pending") {
    const lastSent = new Date(existing.subscribed_at).getTime();
    if (Number.isFinite(lastSent) && Date.now() - lastSent < 120_000) {
      return { ok: true };
    }
  }

  const confirmationToken = randomBytes(32).toString("hex");
  const subscriber = {
    email,
    locale,
    status: "pending" as const,
    confirmation_token_hash: hashToken(confirmationToken),
    confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    subscribed_at: new Date().toISOString(),
    confirmed_at: null,
    unsubscribed_at: null,
  };

  const { data: saved, error: saveError } = existing
    ? await admin.from("newsletter_subscribers").update(subscriber).eq("id", existing.id).select("id").single()
    : await admin.from("newsletter_subscribers").insert(subscriber).select("id").single();
  if (saveError || !saved) {
    console.error("[newsletter] subscriber save failed", saveError?.code);
    return { ok: false, error: "email_unavailable" };
  }

  const confirmUrl = `${origin}/api/newsletter/confirm?token=${confirmationToken}&locale=${locale}`;
  const result = await sendEmail(
    { to: email, ...confirmationEmail(locale, origin, confirmUrl, unsubscribeUrl(origin, saved.id, locale)) },
    { stream: "newsletter" }
  );
  if (!result.sent) {
    console.error("[newsletter] confirmation email not sent:", result.reason);
    return { ok: false, error: "email_unavailable" };
  }

  return { ok: true };
}
