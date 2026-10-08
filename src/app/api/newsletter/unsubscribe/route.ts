import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newsletterActionForm, newsletterNotice } from "@/lib/newsletter/http-response";
import { hashToken, isUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/newsletter/tokens";

function requestLocale(value: string | null): "en" | "fr" {
  return value === "fr" ? "fr" : "en";
}

/** A link opened from an e-mail: shows a confirmation form (a GET never unsubscribes — link scanners follow them). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const locale = requestLocale(request.nextUrl.searchParams.get("locale"));
  if (!isUnsubscribeToken(token)) return newsletterNotice(locale, "invalid");
  return newsletterActionForm(locale, token, "unsubscribe");
}

/**
 * Unsubscribes. Two callers:
 *  - the form above, with the token in the body;
 *  - a mailbox provider's one-click unsubscribe (RFC 8058): it POSTs
 *    `List-Unsubscribe=One-Click` to the address of the List-Unsubscribe
 *    header, so the token is in the query string.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const query = request.nextUrl.searchParams;
  const token = String(form?.get("token") ?? query.get("token") ?? "");
  const locale = requestLocale(String(form?.get("locale") ?? query.get("locale") ?? ""));
  if (!isUnsubscribeToken(token)) return newsletterNotice(locale, "invalid");

  const admin = createAdminClient();
  const signedFor = verifyUnsubscribeToken(token);
  // A token that is not signed is a link from an e-mail sent before signed
  // links existed: it is matched against the stored hash.
  const lookup = admin.from("newsletter_subscribers").select("id, status");
  const { data: subscriber, error: lookupError } = await (signedFor
    ? lookup.eq("id", signedFor)
    : lookup.eq("unsubscribe_token_hash", hashToken(token))
  ).maybeSingle();
  if (lookupError || !subscriber) {
    if (lookupError) console.error("[newsletter] unsubscribe lookup failed", lookupError.code);
    return newsletterNotice(locale, "invalid");
  }
  if (subscriber.status === "unsubscribed") return newsletterNotice(locale, "unsubscribed");

  const { error } = await admin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriber.id);
  if (error) {
    console.error("[newsletter] unsubscribe update failed", error.code);
    return newsletterNotice(locale, "invalid");
  }
  return newsletterNotice(locale, "unsubscribed");
}
