"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Admin moderation actions for message reports (cluster C2).
 *
 * Triage updates run as the authenticated admin through the cookie-aware server
 * client; the message_reports_admin_update RLS policy (migration 00012) gates
 * the write to admins only. We additionally re-check the caller's role here so
 * a non-admin gets a clean error instead of a silent RLS rejection.
 */

const MODERATION_STATUSES = ["open", "reviewed", "dismissed", "actioned"] as const;

const updateReportSchema = z.object({
  reportId: dbId(),
  status: z.enum(MODERATION_STATUSES),
});

export type UpdateReportInput = z.input<typeof updateReportSchema>;

export interface UpdateReportResult {
  success: boolean;
  errorCode?: "not_authorized" | "validation_failed" | "update_failed";
}

async function isCallerAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  return profile?.role === "admin";
}

export async function updateReportStatus(
  input: UpdateReportInput
): Promise<UpdateReportResult> {
  const parsed = updateReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errorCode: "validation_failed" };
  }
  if (!(await isCallerAdmin())) {
    return { success: false, errorCode: "not_authorized" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("message_reports")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.reportId);
  if (error) {
    return { success: false, errorCode: "update_failed" };
  }

  revalidatePath("/admin/messages");
  return { success: true };
}
