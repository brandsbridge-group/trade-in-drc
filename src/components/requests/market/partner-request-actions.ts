"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyCaptchaToken } from "@/lib/messaging/captcha";
import { sendEmail } from "@/lib/email/send";
import { requestConfirmationEmail } from "@/lib/email/request-confirmation";
import { locales, defaultLocale, type Locale } from "@/config/locales";
import type { Json } from "@/lib/supabase/types";
import {
  ATTACHMENT_BUCKET,
  ATTACHMENT_PATH_PATTERN,
  ATTACHMENT_TYPES,
  NEED_INTENT,
  attachmentError,
  partnerRequestDetails,
  validatePartnerRequest,
  type BusinessNeed,
  type FieldErrors,
  type PartnerRequestValues,
} from "@/lib/requests/partner-request";

/**
 * "Find a local partner" (/request): the two server steps of the form.
 *
 * The form is open to visitors without an account, so every write goes through
 * the service-role client and everything is checked here again: the fields
 * (same rules as the form), a hidden trap field, a CAPTCHA when one is
 * configured, and a cap on requests per e-mail address.
 */

/** Requests accepted from one e-mail address per window. */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || null;
}

function asLocale(value: string): Locale {
  return (locales as readonly string[]).includes(value) ? (value as Locale) : defaultLocale;
}

export interface AttachmentUploadResult {
  ok: boolean;
  /** Where to upload, and the one-time token that allows it. */
  path?: string;
  token?: string;
  error?: "too_large" | "bad_type" | "server";
}

/**
 * Hands out a one-time upload slot for the supporting document. The browser
 * then sends the file straight to Storage (a server action cannot carry 10 MB),
 * which enforces the size and type itself (bucket limits, 00065). The path is
 * random and only becomes a request's attachment once the form is submitted
 * with it; an unused upload is just an orphan file.
 */
export async function createRequestAttachmentUpload(file: { size: number; type: string }): Promise<AttachmentUploadResult> {
  const problem = attachmentError(file);
  if (problem) return { ok: false, error: problem };

  const path = `inbox/${randomUUID()}/file.${ATTACHMENT_TYPES[file.type]}`;
  const { data, error } = await createAdminClient().storage.from(ATTACHMENT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[partner-request.upload]", error?.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, path: data.path, token: data.token };
}

export interface PartnerRequestSubmission {
  values: PartnerRequestValues;
  locale: string;
  attachment?: { path: string; name: string } | null;
  captchaToken?: string | null;
  /** Hidden field no person fills in; anything in it marks an automated sender. */
  trap?: string;
}

export interface PartnerRequestResult {
  ok: boolean;
  reference?: string | null;
  /** True only when the confirmation e-mail really left. */
  emailSent?: boolean;
  error?: "validation" | "captcha" | "rate_limited" | "server";
  fieldErrors?: FieldErrors;
}

export async function submitPartnerRequest(input: PartnerRequestSubmission): Promise<PartnerRequestResult> {
  // An automated sender gets the answer it expects and nothing is stored.
  if (input.trap) return { ok: true, reference: null, emailSent: false };

  const values = input.values;
  const fieldErrors = validatePartnerRequest(values);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, error: "validation", fieldErrors };

  const captcha = await verifyCaptchaToken(input.captchaToken, clientIp(await headers()));
  if (!captcha.ok) return { ok: false, error: "captcha" };

  const admin = createAdminClient();
  const email = values.email.trim().toLowerCase();

  const { count } = await admin
    .from("business_requests")
    .select("id", { count: "exact", head: true })
    .ilike("email", email)
    .gte("created_at", new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString());
  if ((count ?? 0) >= RATE_LIMIT_MAX) return { ok: false, error: "rate_limited" };

  // The sector is stored under one name whatever the visitor's language, so
  // the console can filter on it.
  let sector: string | null = null;
  if (UUID_SHAPE.test(values.sectorId)) {
    const { data } = await admin.from("sectors").select("name_en").eq("id", values.sectorId).maybeSingle();
    sector = data?.name_en ?? null;
  }

  // Only a file this app issued a slot for, and that was really uploaded.
  let attachment: { path: string; name: string } | null = null;
  if (input.attachment && ATTACHMENT_PATH_PATTERN.test(input.attachment.path)) {
    const folder = input.attachment.path.slice(0, input.attachment.path.lastIndexOf("/"));
    const { data: files } = await admin.storage.from(ATTACHMENT_BUCKET).list(folder, { limit: 1 });
    if (files && files.length > 0) {
      attachment = { path: input.attachment.path, name: input.attachment.name.trim().slice(0, 200) || "document" };
    }
  }

  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();

  const need = values.need as BusinessNeed;
  const { data: row, error } = await admin
    .from("business_requests")
    .insert({
      submitter_id: user?.id ?? null,
      company_id: null,
      kind: "business",
      intent: NEED_INTENT[need],
      full_name: values.contactPerson.trim(),
      company_name: values.companyName.trim(),
      country: values.country.trim(),
      email,
      phone: values.phone.trim() || null,
      sector,
      preferred_location: values.targetProvince.trim() || null,
      timeline: values.timeline,
      message: values.requirement.trim(),
      details: partnerRequestDetails(values) as unknown as Json,
      attachment_path: attachment?.path ?? null,
      attachment_name: attachment?.name ?? null,
    })
    .select("reference")
    .single();

  if (error || !row) {
    console.error("[partner-request.submit]", error?.code, error?.message);
    return { ok: false, error: "server" };
  }

  let emailSent = false;
  if (row.reference) {
    const locale = asLocale(input.locale);
    try {
      const t = await getTranslations({ locale, namespace: "FindPartner" });
      const message = await requestConfirmationEmail({
        locale,
        to: email,
        name: values.contactPerson.trim(),
        reference: row.reference,
        summary: `${t(`needs.${need}`)} — ${values.productService.trim()}`,
      });
      emailSent = (await sendEmail(message)).sent;
    } catch (mailError) {
      // The request is recorded; a missing e-mail must not turn it into a failure.
      console.error("[partner-request.email]", mailError);
    }
  }

  return { ok: true, reference: row.reference, emailSent };
}
