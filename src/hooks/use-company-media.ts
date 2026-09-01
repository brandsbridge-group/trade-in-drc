"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CompanyMediaKind } from "@/lib/supabase/types";

/**
 * Company media management (Req 4).
 *
 * Three storage-backed concerns share one table (`company_media`, migration
 * 00018) plus the company `logo_url` column (migration 00001):
 *   - LOGO     -> companies.logo_url + `company-media` bucket
 *   - GALLERY  -> company_media (kind='gallery') + `company-media` bucket
 *   - BROCHURE -> company_media (kind='brochure') + `company-brochures` bucket
 *   - VIDEO    -> company_media (kind='video'), url is an external embed URL
 *
 * RLS (00018) lets the company OWNER (and admins) read/write their own rows and
 * objects under `<companies.id>/<filename>`. Every upload here writes into that
 * owner folder so the storage policy's `storage.foldername(name)[1]` owner check
 * passes. Trust columns on companies are admin-only and never touched here.
 */

// -- Buckets & validation constants ------------------------------------------

export const MEDIA_BUCKET = "company-media";
export const BROCHURE_BUCKET = "company-brochures";

/** Logo + gallery accept the same raster image types. */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const BROCHURE_MIME_TYPES = ["application/pdf"] as const;
export const BROCHURE_ACCEPT = ".pdf";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_BROCHURE_BYTES = 15 * 1024 * 1024; // 15 MB

/** Per-kind quota caps. Logo is implicitly single (overwrites companies.logo_url). */
export const QUOTA = {
  gallery: 12,
  brochure: 6,
  video: 6,
} as const;

/** Storage-backed kinds (everything except the externally-hosted video embed). */
export type StorageMediaKind = Extract<CompanyMediaKind, "gallery" | "brochure">;

export interface CompanyMediaRow {
  id: string;
  company_id: string;
  kind: CompanyMediaKind;
  url: string;
  title_en: string | null;
  title_fr: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Discriminated union of validation failure reasons (for i18n on the caller). */
export type MediaValidationError =
  | { reason: "type" }
  | { reason: "size"; maxBytes: number }
  | { reason: "quota"; max: number };

const queryKey = (companyId: string | undefined) =>
  ["company-media", companyId] as const;

// -- Validation (pure) --------------------------------------------------------

/**
 * Validates a candidate image file (logo or gallery) against type, size and —
 * when a current count is supplied — the per-kind quota. Returns `null` on pass.
 */
export function validateImageFile(
  file: File,
  options?: { currentCount?: number; max?: number },
): MediaValidationError | null {
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { reason: "type" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { reason: "size", maxBytes: MAX_IMAGE_BYTES };
  }
  if (
    options?.max !== undefined &&
    options.currentCount !== undefined &&
    options.currentCount >= options.max
  ) {
    return { reason: "quota", max: options.max };
  }
  return null;
}

/** Validates a brochure PDF against type, size and the brochure quota. */
export function validateBrochureFile(
  file: File,
  currentCount: number,
): MediaValidationError | null {
  if (!(BROCHURE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { reason: "type" };
  }
  if (file.size > MAX_BROCHURE_BYTES) {
    return { reason: "size", maxBytes: MAX_BROCHURE_BYTES };
  }
  if (currentCount >= QUOTA.brochure) {
    return { reason: "quota", max: QUOTA.brochure };
  }
  return null;
}

/**
 * Builds a unique, owner-scoped object path: `<companyId>/<ts>-<rand>.<ext>`.
 * The leading company-id folder is what the storage RLS owner check keys on.
 */
function buildObjectPath(companyId: string, fileName: string): string {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()!.toLowerCase()
    : "bin";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${companyId}/${unique}.${ext}`;
}

/** Derives the bucket object path from a stored public URL, or null if foreign. */
function objectPathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

// -- Queries ------------------------------------------------------------------

/** All company_media rows for a company, plus the company's current logo_url. */
export function useCompanyMedia(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKey(companyId),
    queryFn: async (): Promise<{
      logoUrl: string | null;
      media: CompanyMediaRow[];
    }> => {
      const supabase = createClient();
      const [companyRes, mediaRes] = await Promise.all([
        supabase
          .from("companies")
          .select("logo_url")
          .eq("id", companyId!)
          .single(),
        supabase
          .from("company_media")
          .select("*")
          .eq("company_id", companyId!)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      if (companyRes.error) throw companyRes.error;
      if (mediaRes.error) throw mediaRes.error;
      return {
        logoUrl: companyRes.data?.logo_url ?? null,
        media: (mediaRes.data ?? []) as CompanyMediaRow[],
      };
    },
    enabled: !!companyId,
  });
}

// -- Mutations ----------------------------------------------------------------

/** Uploads a logo to the company-media bucket and points companies.logo_url at it. */
export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      file,
    }: {
      companyId: string;
      file: File;
    }) => {
      const supabase = createClient();
      const path = buildObjectPath(companyId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(path);

      const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", companyId)
        .select("id");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        // RLS / ownership rejected the write — clean up the orphan object.
        await supabase.storage.from(MEDIA_BUCKET).remove([path]);
        throw new Error("forbidden");
      }
      return urlData.publicUrl;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.companyId) });
    },
  });
}

/**
 * Uploads a storage-backed media file (gallery image or brochure PDF) and
 * inserts the matching company_media row. Bucket is derived from the kind.
 */
export function useUploadMediaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      kind,
      file,
    }: {
      companyId: string;
      kind: StorageMediaKind;
      file: File;
    }) => {
      const supabase = createClient();
      const bucket = kind === "brochure" ? BROCHURE_BUCKET : MEDIA_BUCKET;
      const path = buildObjectPath(companyId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const title = kind === "brochure" ? file.name : null;
      const { data: inserted, error: insertError } = await supabase
        .from("company_media")
        .insert({
          company_id: companyId,
          kind,
          url: urlData.publicUrl,
          title_en: title,
          title_fr: title,
        })
        .select("*")
        .single();
      if (insertError) {
        // RLS rejected the row — clean up the orphan object.
        await supabase.storage.from(bucket).remove([path]);
        throw insertError;
      }
      return inserted as CompanyMediaRow;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.companyId) });
    },
  });
}

/** Inserts a video embed row (external URL — no storage object). */
export function useAddVideoEmbed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      url,
    }: {
      companyId: string;
      url: string;
    }) => {
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("company_media")
        .insert({ company_id: companyId, kind: "video", url })
        .select("*")
        .single();
      if (error) throw error;
      return inserted as CompanyMediaRow;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.companyId) });
    },
  });
}

/**
 * Deletes a company_media row, plus its backing storage object when the row is
 * storage-backed (gallery/brochure). Video rows have no object to remove.
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ row }: { companyId: string; row: CompanyMediaRow }) => {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("company_media")
        .delete()
        .eq("id", row.id);
      if (deleteError) throw deleteError;

      if (row.kind !== "video") {
        const bucket = row.kind === "brochure" ? BROCHURE_BUCKET : MEDIA_BUCKET;
        const path = objectPathFromPublicUrl(row.url, bucket);
        if (path) {
          // Best-effort object cleanup; the DB row (the source of truth) is gone.
          await supabase.storage.from(bucket).remove([path]);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.companyId) });
    },
  });
}

/** Clears companies.logo_url and removes the backing object. */
export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      logoUrl,
    }: {
      companyId: string;
      logoUrl: string;
    }) => {
      const supabase = createClient();
      const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", companyId)
        .select("id");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) throw new Error("forbidden");

      const path = objectPathFromPublicUrl(logoUrl, MEDIA_BUCKET);
      if (path) {
        await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.companyId) });
    },
  });
}
