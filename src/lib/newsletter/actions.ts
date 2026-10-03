"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewsletterConfirmationEmail } from "@/lib/email/resend";

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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
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
  const unsubscribeToken = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const subscriber = {
    email,
    locale,
    status: "pending" as const,
    confirmation_token_hash: hashToken(confirmationToken),
    confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    unsubscribe_token_hash: hashToken(unsubscribeToken),
    subscribed_at: now,
    confirmed_at: null,
    unsubscribed_at: null,
  };

  const { error: saveError } = existing
    ? await admin.from("newsletter_subscribers").update(subscriber).eq("id", existing.id)
    : await admin.from("newsletter_subscribers").insert(subscriber);
  if (saveError) {
    console.error("[newsletter] subscriber save failed", saveError.code);
    return { ok: false, error: "email_unavailable" };
  }

  const confirmUrl = `${siteOrigin()}/api/newsletter/confirm?token=${confirmationToken}&locale=${locale}`;
  const unsubscribeUrl = `${siteOrigin()}/api/newsletter/unsubscribe?token=${unsubscribeToken}&locale=${locale}`;
  try {
    await sendNewsletterConfirmationEmail(email, confirmUrl, unsubscribeUrl, locale);
  } catch (error) {
    console.error("[newsletter] confirmation email failed", error);
    return { ok: false, error: "email_unavailable" };
  }

  return { ok: true };
}
