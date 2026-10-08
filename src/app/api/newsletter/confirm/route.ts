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
  return newsletterActionForm(locale, token, "confirm");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const locale = String(form.get("locale") ?? "") === "fr" ? "fr" : "en";
  if (!/^[a-f0-9]{64}$/.test(token)) return newsletterNotice(locale, "invalid");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .update({
      status: "active",
      confirmation_token_hash: null,
      confirmation_expires_at: null,
      confirmed_at: new Date().toISOString(),
    })
    .eq("confirmation_token_hash", tokenHash(token))
    .eq("status", "pending")
    .gt("confirmation_expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[newsletter] confirmation update failed", error.code);
    return newsletterNotice(locale, "invalid");
  }
  return newsletterNotice(locale, data ? "confirmed" : "invalid");
}
