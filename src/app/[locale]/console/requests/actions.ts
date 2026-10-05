"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireCallerAdmin } from "@/lib/auth/require-caller-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ATTACHMENT_BUCKET } from "@/lib/requests/partner-request";

/**
 * Admin actions for the "Received Requests" dashboard (business_requests).
 *
 * Writes run as the authenticated admin through the cookie-aware server client.
 * The status / follow_up_owner / admin_notes columns are REVOKE'd from owners
 * and only writable under the admin RLS policy (migration 00022). We re-check
 * the caller's role here so a non-admin gets a clean error instead of a silent
 * RLS rejection.
 */

const BUSINESS_REQUEST_STATUSES = [
  "new",
  "in_progress",
  "converted",
  "pending",
  "closed",
  "rejected",
] as const;

const updateBusinessRequestSchema = z
  .object({
    id: dbId(),
    status: z.enum(BUSINESS_REQUEST_STATUSES).optional(),
    followUpOwner: z.string().trim().max(200).nullable().optional(),
    adminNote: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.followUpOwner !== undefined ||
      v.adminNote !== undefined,
    { message: "no_fields" }
  );

const deleteBusinessRequestSchema = z.object({
  id: dbId(),
});

export type UpdateBusinessRequestInput = z.input<
  typeof updateBusinessRequestSchema
>;
export type DeleteBusinessRequestInput = z.input<
  typeof deleteBusinessRequestSchema
>;

export interface AdminActionResult {
  ok: boolean;
  error?: "not_authorized" | "validation_failed" | "write_failed";
}

export async function updateBusinessRequest(
  input: UpdateBusinessRequestInput
): Promise<AdminActionResult> {
  const parsed = updateBusinessRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }
  const caller = await requireCallerAdmin();
  if (!caller.ok) {
    return { ok: false, error: "not_authorized" };
  }

  const { id, status, followUpOwner, adminNote } = parsed.data;
  const patch: {
    status?: (typeof BUSINESS_REQUEST_STATUSES)[number];
    follow_up_owner?: string | null;
    admin_notes?: string | null;
  } = {};
  if (status !== undefined) patch.status = status;
  if (followUpOwner !== undefined) {
    patch.follow_up_owner = followUpOwner === "" ? null : followUpOwner;
  }
  if (adminNote !== undefined) {
    patch.admin_notes = adminNote === "" ? null : adminNote;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("business_requests")
    .update(patch)
    .eq("id", id);
  if (error) {
    return { ok: false, error: "write_failed" };
  }

  revalidatePath("/console/requests");
  return { ok: true };
}

const forwardBusinessRequestSchema = z.object({
  id: dbId(),
});

export type ForwardBusinessRequestInput = z.input<
  typeof forwardBusinessRequestSchema
>;

export interface ForwardBusinessRequestResult {
  ok: boolean;
  error?: "not_authorized" | "validation_failed" | "no_target" | "write_failed";
}

/**
 * Passes a request on to the company it is addressed to (migration 00062).
 * From then on the company reads it — buyer contact details included — under
 * "Received requests" in its dashboard, through `company_received_requests()`.
 *
 * Only a request with a target company can be forwarded; forwarding twice is a
 * no-op. A request still "new" moves to "in progress": it has been handled.
 */
export async function forwardBusinessRequest(
  input: ForwardBusinessRequestInput
): Promise<ForwardBusinessRequestResult> {
  const parsed = forwardBusinessRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }
  const caller = await requireCallerAdmin();
  if (!caller.ok) {
    return { ok: false, error: "not_authorized" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: row, error: readError } = await supabase
    .from("business_requests")
    .select("id, status, target_company_id, forwarded_at")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readError || !row) {
    return { ok: false, error: "write_failed" };
  }
  if (!row.target_company_id) {
    return { ok: false, error: "no_target" };
  }
  if (row.forwarded_at) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("business_requests")
    .update({
      forwarded_at: new Date().toISOString(),
      forwarded_by: caller.userId ?? null,
      ...(row.status === "new" ? { status: "in_progress" as const } : {}),
    })
    .eq("id", row.id)
    .is("forwarded_at", null);
  if (error) {
    return { ok: false, error: "write_failed" };
  }

  revalidatePath("/console/requests");
  return { ok: true };
}

export async function deleteBusinessRequest(
  input: DeleteBusinessRequestInput
): Promise<AdminActionResult> {
  const parsed = deleteBusinessRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }
  const caller = await requireCallerAdmin();
  if (!caller.ok) {
    return { ok: false, error: "not_authorized" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("business_requests")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    return { ok: false, error: "write_failed" };
  }

  revalidatePath("/console/requests");
  return { ok: true };
}

const ATTACHMENT_LINK_SECONDS = 5 * 60;

export interface RequestAttachmentResult {
  ok: boolean;
  url?: string;
  error?: "not_authorized" | "validation_failed" | "not_found";
}

/**
 * A short-lived link to the document a visitor attached to a request (00065).
 * The bucket is private and has no storage policy: only this staff-checked
 * action hands a link out, signed for a few minutes.
 */
export async function getRequestAttachmentUrl(input: { id: string }): Promise<RequestAttachmentResult> {
  const parsed = deleteBusinessRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation_failed" };
  const caller = await requireCallerAdmin();
  if (!caller.ok) return { ok: false, error: "not_authorized" };

  const supabase = await createServerSupabaseClient();
  const { data: row } = await supabase
    .from("business_requests")
    .select("attachment_path, attachment_name")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row?.attachment_path) return { ok: false, error: "not_found" };

  const { data, error } = await createAdminClient()
    .storage.from(ATTACHMENT_BUCKET)
    .createSignedUrl(row.attachment_path, ATTACHMENT_LINK_SECONDS, { download: row.attachment_name ?? true });
  if (error || !data?.signedUrl) return { ok: false, error: "not_found" };
  return { ok: true, url: data.signedUrl };
}
