import { slugify } from "@/lib/content/slug";
import type { DocumentType } from "@/constants/status";

/**
 * Client-side limits for registration-wizard document uploads. Mirrored by the
 * bucket-level `file_size_limit` / `allowed_mime_types` set on `company-documents`
 * (see supabase/migrations/00043_company_documents_bucket_limits.sql — written but
 * NOT applied; apply it to get server-side enforcement, not just this check).
 *
 * 5 MB matches the copy already shown to applicants in
 * `RegisterCompany.documents.helper` ("Max 5MB per file") — do not raise this
 * without updating that string in all five locales.
 */
export const MAX_REGISTRATION_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_REGISTRATION_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

/** Passed to the file input's `accept` attribute — kept in sync with the MIME list above. */
export const ACCEPTED_REGISTRATION_DOCUMENT_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

export type DocumentValidationError = "type" | "size";

/**
 * Validates a selected file against the accepted MIME types and size ceiling.
 * Takes a structural subset of `File` so it is testable without constructing
 * real File/Blob instances in a jsdom-less test runner.
 */
export function validateRegistrationDocument(
  file: Pick<File, "type" | "size">
): { ok: true } | { ok: false; reason: DocumentValidationError } {
  if (!ACCEPTED_REGISTRATION_DOCUMENT_MIME_TYPES.includes(
    file.type as (typeof ACCEPTED_REGISTRATION_DOCUMENT_MIME_TYPES)[number]
  )) {
    return { ok: false, reason: "type" };
  }
  if (file.size > MAX_REGISTRATION_DOCUMENT_BYTES) {
    return { ok: false, reason: "size" };
  }
  return { ok: true };
}

/**
 * Object key for a registration document inside the `company-documents` bucket.
 * The FIRST path segment must be the owning company's id — that is exactly
 * what `company_documents_bucket_owner_upload` (migrations 00001 + 00011)
 * checks via `(storage.foldername(name))[1]`, so uploads can only happen
 * AFTER the company row exists and only by its owner.
 *
 * `now` is injectable so the key builder is deterministic under test.
 */
export function buildRegistrationDocumentPath(
  companyId: string,
  type: DocumentType,
  fileName: string,
  now: number = Date.now()
): string {
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex > 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "bin";
  const base = slugify(dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName) || "file";
  return `${companyId}/${type}-${now}-${base}.${ext}`;
}
