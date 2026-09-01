"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/constants/storage";
import { slugify } from "@/lib/content/slug";

// Admin-curated assets (report PDFs/attachments, content cover images) are not
// tied to a company, so they live under an `admin/<folder>/` prefix in the public
// `company-assets` bucket. The bucket's RLS only lets company owners write to
// company-id-prefixed folders, so admins upload via the service-role client after
// an explicit role check below — never exposing the service key to the browser.
const ADMIN_PREFIX = "admin";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB ceiling for attachments/covers.

const ALLOWED: Record<AdminAssetFolder, { mime: RegExp; label: string }> = {
  "report-attachments": { mime: /^(application\/pdf|image\/|application\/(msword|vnd\.))/, label: "report" },
  "content-covers": { mime: /^image\//, label: "cover" },
};

export type AdminAssetFolder = "report-attachments" | "content-covers";

export interface AdminAssetUploadResult {
  url?: string;
  error?: string;
}

/**
 * Upload a single admin asset to public storage and return its public URL.
 * Validates auth (admin only), MIME, and size at the boundary.
 */
export async function uploadAdminAsset(
  formData: FormData
): Promise<AdminAssetUploadResult> {
  const folder = formData.get("folder");
  const file = formData.get("file");

  if (folder !== "report-attachments" && folder !== "content-covers") {
    return { error: "invalid_folder" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "no_file" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "too_large" };
  }
  const rules = ALLOWED[folder];
  if (!rules.mime.test(file.type)) {
    return { error: "invalid_type" };
  }

  // Authorize: the caller must be an authenticated admin.
  const userClient = await createServerSupabaseClient();
  const { data: auth } = await userClient.auth.getUser();
  if (!auth.user) {
    return { error: "unauthenticated" };
  }
  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profileError) {
    console.error("[uploadAdminAsset] profile fetch failed", profileError.code, profileError.message);
    return { error: "profile_lookup_failed" };
  }
  if (profile?.role !== "admin") {
    return { error: "not_authorized" };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
  const path = `${ADMIN_PREFIX}/${folder}/${Date.now()}-${base}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKETS.COMPANY_ASSETS)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("[uploadAdminAsset] upload failed", uploadError.message);
    return { error: "upload_failed" };
  }

  const { data: urlData } = admin.storage
    .from(STORAGE_BUCKETS.COMPANY_ASSETS)
    .getPublicUrl(path);

  return { url: urlData.publicUrl };
}
