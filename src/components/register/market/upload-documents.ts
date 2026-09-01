import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/constants/storage";
import { DOCUMENT_TYPE, type DocumentType } from "@/constants/status";
import { buildRegistrationDocumentPath } from "@/lib/storage/registration-documents";

/**
 * The four registration-wizard dropzones, mapped to the canonical
 * `company_documents.type` enum (migration 00011, widened by 00044).
 *
 * CRITICAL FIX (code review, post-e07847f): `additionalName` used to map to
 * `proof_of_address`. That is one of the three types
 * `EXPECTED_DOC_TYPES` (src/constants/status.ts) counts for the admin
 * verification queue's completeness dots
 * (src/app/[locale]/admin/verifications/page.tsx). Since "Additional
 * documents" is an optional, unvalidated catch-all — a business card, a
 * brochure, literally anything — that mapping let ANY file dropped there
 * make "Proof of address: uploaded" read as satisfied without the applicant
 * ever having proved an address. On a government portal that is a
 * compliance defect, not a labeling nitpick.
 *
 * Interim fix: mapped it to `photo` (an existing, already-valid enum value
 * excluded from `EXPECTED_DOC_TYPES`) so the field kept working without a
 * schema change while remaining excluded from completeness scoring.
 *
 * FOLLOW-UP FIX (migration 00044): `photo` was a borrowed, wrong label — a
 * PDF filed as "Photo" is confusing for a reviewer. `additional_document`
 * is now its own canonical `company_documents.type` value (added to the DB
 * CHECK by migration 00044), still deliberately EXCLUDED from
 * `EXPECTED_DOC_TYPES` for the same reason `photo`/`logo` are: it is a
 * branding/optional asset, not verification evidence.
 *
 * The file is NOT hidden from admins: `DocumentViewer`
 * (src/components/admin/document-viewer.tsx) on the per-company review page
 * renders every `company_documents` row regardless of type — the badge now
 * reads "Additional document" instead of implying a regulatory document or
 * a photo. It is only absent from the list-page completeness dots, which is
 * the correct behaviour: no dot should exist for a document type nothing
 * actually collects proof of.
 *
 * Net effect: this registration flow has no field that maps to
 * `proof_of_address` at all, so that dot will show "missing" for every
 * company registered through it. That is honest — the wizard never
 * collects a real proof-of-address document — not a regression from a
 * previously-passing (but fake) check.
 */
export const DOCUMENT_FIELD_TYPES = {
  rccmCertName: DOCUMENT_TYPE.BUSINESS_LICENSE,
  nifDocName: DOCUMENT_TYPE.TAX_REGISTRATION,
  logoName: DOCUMENT_TYPE.LOGO,
  additionalName: DOCUMENT_TYPE.ADDITIONAL_DOCUMENT,
} as const satisfies Record<string, DocumentType>;

export type DocumentField = keyof typeof DOCUMENT_FIELD_TYPES;

export type RegistrationDocumentFiles = Partial<Record<DocumentField, File>>;

export interface UploadRegistrationDocumentsResult {
  uploaded: DocumentField[];
  failed: { field: DocumentField; reason: string }[];
}

/**
 * Uploads the files picked on the Documents step to the private
 * `company-documents` bucket and records each one in `company_documents`.
 *
 * MUST run after the `companies` row exists and only be called by the
 * authenticated owner — `company_documents_bucket_owner_upload` and
 * `company_documents_owner_insert` both check `owner_id = auth.uid()` against
 * `companyId`, which cannot resolve before the insert in
 * `register-company-actions.ts` has committed. Uses the browser client (never
 * the service-role admin client) so RLS actually applies.
 *
 * Never throws — a document upload failure must not undo or block the
 * company registration that already succeeded. Each file fails or succeeds
 * independently; the caller surfaces `failed` as an actionable toast.
 */
export async function uploadRegistrationDocuments(
  companyId: string,
  files: RegistrationDocumentFiles
): Promise<UploadRegistrationDocumentsResult> {
  const supabase = createClient();
  const uploaded: DocumentField[] = [];
  const failed: { field: DocumentField; reason: string }[] = [];

  const entries = (Object.entries(files) as [DocumentField, File | undefined][]).filter(
    (entry): entry is [DocumentField, File] => Boolean(entry[1])
  );

  for (const [field, file] of entries) {
    const type = DOCUMENT_FIELD_TYPES[field];
    const path = buildRegistrationDocumentPath(companyId, type, file.name);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.COMPANY_DOCUMENTS)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[uploadRegistrationDocuments] storage upload failed", field, uploadError.message);
      failed.push({ field, reason: "upload" });
      continue;
    }

    const { error: rowError } = await supabase.from("company_documents").insert({
      company_id: companyId,
      type,
      file_url: path,
      file_name: file.name,
    });

    if (rowError) {
      console.error("[uploadRegistrationDocuments] row insert failed", field, rowError.message);
      failed.push({ field, reason: "record" });
      continue;
    }

    uploaded.push(field);
  }

  return { uploaded, failed };
}
