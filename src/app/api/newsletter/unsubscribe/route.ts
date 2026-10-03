import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newsletterActionForm, newsletterNotice } from "@/lib/newsletter/http-response";

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "fr" ? "fr" : "en";
  if (!/^[a-f0-9]{64}$/.test(token)) return newsletterNotice(locale, "invalid");
  return newsletterActionForm(locale, token, "unsubscribe");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const locale = String(form.get("locale") ?? "") === "fr" ? "fr" : "en";
  if (!/^[a-f0-9]{64}$/.test(token)) return newsletterNotice(locale, "invalid");
  const admin = createAdminClient();
  const hash = tokenHash(token);
  const { data: subscriber, error: lookupError } = await admin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("unsubscribe_token_hash", hash)
    .maybeSingle();
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
