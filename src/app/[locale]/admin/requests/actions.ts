"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireCallerAdmin } from "@/lib/auth/require-caller-admin";

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

  revalidatePath("/admin/requests");
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

  revalidatePath("/admin/requests");
  return { ok: true };
}
