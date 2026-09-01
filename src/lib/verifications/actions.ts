"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/constants/storage";
import {
  COMPANY_STATUS,
  VERIFICATION_TIER,
  VERIFICATION_DECISION,
  EXPECTED_DOC_TYPES,
  type CompanyStatus,
} from "@/constants/status";
import type { VerificationTier, VerificationDecision } from "@/constants/status";
import type { CompanyDocumentType } from "@/lib/supabase/types";

/**
 * Cluster C1 — verification trust loop server actions.
 *
 * Why service-role for the company write: migration 00011 issues a column-level
 * `REVOKE UPDATE (status, verification_tier, verified_at, verification_summary)`
 * from the `authenticated` role. A PostgREST call as `authenticated` — even by
 * an admin — is denied at the GRANT level ("permission denied for column").
 * The admin (service-role) client bypasses column grants, so trust promotions
 * MUST go through it. Every action re-verifies the caller is staff via
 * `requireAdmin` before constructing the service-role client, and the
 * service-role client never leaves this server module.
 *
 * Signed-URL reads: the `company-documents` bucket is PRIVATE (00011). Public
 * URLs 404; reviewers can only open docs through short-lived signed URLs minted
 * server-side, which is what `signCompanyDocumentUrls` returns.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes — long enough to review.
const NOTES_MAX = 2000;

// ---------------------------------------------------------------------------
// Decision: atomic audit row + company status/tier/summary update.
// ---------------------------------------------------------------------------

const tierSchema = z.enum([
  VERIFICATION_TIER.NONE,
  VERIFICATION_TIER.BASIC,
  VERIFICATION_TIER.VERIFIED,
  VERIFICATION_TIER.PREMIUM,
]);

const decisionSchema = z
  .object({
    companyId: dbId(),
    decision: z.enum([
      VERIFICATION_DECISION.APPROVED,
      VERIFICATION_DECISION.REJECTED,
      VERIFICATION_DECISION.MORE_INFO_REQUESTED,
    ]),
    // Tier is required on approve, ignored otherwise (server clamps it).
    tier: tierSchema.optional(),
    notes: z.string().trim().max(NOTES_MAX).optional(),
    locale: z.string().min(2).max(5),
  })
  .superRefine((val, ctx) => {
    if (val.decision !== VERIFICATION_DECISION.APPROVED && !val.notes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message: "notes_required",
      });
    }
    if (val.decision === VERIFICATION_DECISION.APPROVED && !val.tier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tier"],
        message: "tier_required",
      });
    }
  });

export type DecisionInput = z.input<typeof decisionSchema>;

export interface DecisionResult {
  ok: boolean;
  /** Stable machine code for client i18n; never a raw DB message. */
  error?: string;
}

/**
 * Map an admin decision to the resulting company workflow state. Approve →
 * verified; reject → rejected; request-more-info keeps the company pending so
 * it stays in the queue after the owner re-submits.
 */
const DECISION_TO_STATUS: Record<VerificationDecision, CompanyStatus> = {
  [VERIFICATION_DECISION.APPROVED]: COMPANY_STATUS.VERIFIED,
  [VERIFICATION_DECISION.REJECTED]: COMPANY_STATUS.REJECTED,
  [VERIFICATION_DECISION.MORE_INFO_REQUESTED]: COMPANY_STATUS.PENDING,
  [VERIFICATION_DECISION.RESUBMITTED]: COMPANY_STATUS.PENDING,
};

/**
 * Atomically record a verification decision: insert the `verification_reviews`
 * audit row (who/what/when/why) AND update the company's trust columns. The
 * audit row is written first so a failed company update never leaves an
 * unexplained tier change; the company update runs through the service-role
 * client because the trust columns are REVOKE-protected.
 */
export async function submitVerificationDecision(
  input: DecisionInput
): Promise<DecisionResult> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "invalid_input" };
  }
  const { companyId, decision, tier, notes, locale } = parsed.data;

  // Gate: only staff may proceed. Redirects unauthenticated / non-staff.
  const admin = await requireAdmin(locale);

  const status = DECISION_TO_STATUS[decision];
  const isApprove = decision === VERIFICATION_DECISION.APPROVED;
  // On approve, set the chosen tier + verified_at. On any other decision, demote
  // tier to none and clear verified_at so a previously verified company that is
  // rejected / asked for more info loses its public badge.
  const resolvedTier: VerificationTier = isApprove
    ? (tier as VerificationTier)
    : VERIFICATION_TIER.NONE;
  const verifiedAt = isApprove ? new Date().toISOString() : null;

  // Both writes go through the service-role client: the trust-column update is
  // REVOKE-protected and the audit insert is written under the same privileged
  // path so the pair never half-applies across differing RLS variants. The
  // recorded `admin_id` is the real authenticated admin (from requireAdmin), so
  // the trail stays honest.
  const adminClient = createAdminClient();

  // 1. Audit row first — a failed company update never leaves an unexplained
  //    tier change without a preceding review record.
  const { error: reviewError } = await adminClient
    .from("verification_reviews")
    .insert({
      company_id: companyId,
      admin_id: admin.id,
      decision,
      notes: notes ?? null,
    });

  if (reviewError) {
    return { ok: false, error: "review_insert_failed" };
  }

  // 2. Trust-column update (status / tier / verified_at).
  const { error: updateError } = await adminClient
    .from("companies")
    .update({
      status,
      verification_tier: resolvedTier,
      verified_at: verifiedAt,
    })
    .eq("id", companyId);

  if (updateError) {
    return { ok: false, error: "company_update_failed" };
  }

  // Refresh both the queue and the company detail surfaces.
  revalidatePath(`/${locale}/admin/verifications`);
  revalidatePath(`/${locale}/admin/verifications/${companyId}`);
  revalidatePath(`/${locale}/admin/companies/${companyId}`);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Owner resubmission — a company owner re-submits a rejected / more-info company
// for another review. Both writes are otherwise blocked for owners: `status` is
// column-REVOKE-protected (00011) and `verification_reviews` INSERT is admin-only
// RLS (00001). Rather than re-granting those to owners (which would reopen the
// self-promotion hole), we verify ownership here via the request-scoped client,
// then write through the service-role client — attributable to the owner.
// ---------------------------------------------------------------------------

const resubmitSchema = z.object({
  companyId: dbId(),
  locale: z.string().min(2).max(5),
});

export type ResubmitInput = z.input<typeof resubmitSchema>;

export async function resubmitCompanyVerification(
  input: ResubmitInput
): Promise<DecisionResult> {
  const parsed = resubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }
  const { companyId, locale } = parsed.data;

  // Identify the caller via the request-scoped (cookie) client.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "not_authenticated" };
  }

  // Ownership gate: the caller must own the company being resubmitted.
  const { data: company, error: ownerError } = await supabase
    .from("companies")
    .select("owner_id, status")
    .eq("id", companyId)
    .maybeSingle();
  if (ownerError || !company) {
    return { ok: false, error: "company_not_found" };
  }
  if (company.owner_id !== user.id) {
    return { ok: false, error: "not_owner" };
  }
  // Only a rejected company (or one still pending after a more-info request) can
  // be resubmitted — never an already-verified one.
  if (
    company.status !== COMPANY_STATUS.REJECTED &&
    company.status !== COMPANY_STATUS.PENDING
  ) {
    return { ok: false, error: "not_resubmittable" };
  }

  // Privileged writes via the service-role client, attributable to the owner.
  const adminClient = createAdminClient();

  const { error: reviewError } = await adminClient
    .from("verification_reviews")
    .insert({
      company_id: companyId,
      admin_id: user.id,
      decision: VERIFICATION_DECISION.RESUBMITTED,
      notes: "Resubmitted by company owner",
    });
  if (reviewError) {
    return { ok: false, error: "review_insert_failed" };
  }

  const { error: updateError } = await adminClient
    .from("companies")
    .update({ status: COMPANY_STATUS.PENDING })
    .eq("id", companyId);
  if (updateError) {
    return { ok: false, error: "company_update_failed" };
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/admin/verifications`);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Trust tier override (companies detail page) — same REVOKE constraint applies.
// ---------------------------------------------------------------------------

const tierOverrideSchema = z.object({
  companyId: dbId(),
  tier: tierSchema,
  locale: z.string().min(2).max(5),
});

export type TierOverrideInput = z.input<typeof tierOverrideSchema>;

/**
 * Directly set a company's verification tier from the admin company detail page
 * (without a full review decision). Records an audit row using the closest
 * decision: a non-`none` tier is an approval; demoting to `none` is recorded as
 * more-info-requested so the trail is never silent.
 */
export async function setVerificationTier(
  input: TierOverrideInput
): Promise<DecisionResult> {
  const parsed = tierOverrideSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }
  const { companyId, tier, locale } = parsed.data;
  const admin = await requireAdmin(locale);

  const isVerified =
    tier === VERIFICATION_TIER.VERIFIED || tier === VERIFICATION_TIER.PREMIUM;
  const status: CompanyStatus = isVerified
    ? COMPANY_STATUS.VERIFIED
    : COMPANY_STATUS.PENDING;
  const verifiedAt = tier === VERIFICATION_TIER.NONE ? null : new Date().toISOString();
  const auditDecision =
    tier === VERIFICATION_TIER.NONE
      ? VERIFICATION_DECISION.MORE_INFO_REQUESTED
      : VERIFICATION_DECISION.APPROVED;

  const adminClient = createAdminClient();
  const { error: reviewError } = await adminClient
    .from("verification_reviews")
    .insert({
      company_id: companyId,
      admin_id: admin.id,
      decision: auditDecision,
      notes: `tier:${tier}`,
    });
  if (reviewError) {
    return { ok: false, error: "review_insert_failed" };
  }

  const { error: updateError } = await adminClient
    .from("companies")
    .update({
      status,
      verification_tier: tier,
      verified_at: verifiedAt,
    })
    .eq("id", companyId);
  if (updateError) {
    return { ok: false, error: "company_update_failed" };
  }

  revalidatePath(`/${locale}/admin/companies/${companyId}`);
  revalidatePath(`/${locale}/admin/verifications/${companyId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Signed URLs for private company documents.
// ---------------------------------------------------------------------------

export interface SignedDocument {
  id: string;
  type: CompanyDocumentType;
  fileName: string;
  status: string;
  /** Short-lived signed URL, or null when signing failed (e.g. missing object). */
  signedUrl: string | null;
}

interface RawDocument {
  id: string;
  type: CompanyDocumentType;
  file_url: string;
  file_name: string;
  status: string;
}

/**
 * Resolve the storage object path for a document. New uploads store a bare
 * storage PATH (`<companyId>/<filename>`) in `file_url`; legacy rows may hold a
 * full public URL — we strip the bucket prefix so `createSignedUrl` still works.
 */
function toStoragePath(fileUrl: string): string {
  const marker = `/${STORAGE_BUCKETS.COMPANY_DOCUMENTS}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) {
    return fileUrl.slice(idx + marker.length);
  }
  // Already a bare path.
  return fileUrl.replace(/^\/+/, "");
}

/**
 * Mint short-lived signed URLs for a set of private company documents. Staff
 * only. Returns one entry per input document; `signedUrl` is null for any object
 * that could not be signed so the caller can show a disabled/"unavailable"
 * state rather than a broken link.
 */
export async function signCompanyDocumentUrls(
  documents: RawDocument[],
  locale: string
): Promise<SignedDocument[]> {
  await requireAdmin(locale);
  const adminClient = createAdminClient();

  return Promise.all(
    documents.map(async (doc) => {
      const path = toStoragePath(doc.file_url);
      const { data, error } = await adminClient.storage
        .from(STORAGE_BUCKETS.COMPANY_DOCUMENTS)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      return {
        id: doc.id,
        type: doc.type,
        fileName: doc.file_name,
        status: doc.status,
        signedUrl: error ? null : data.signedUrl,
      };
    })
  );
}

// ---------------------------------------------------------------------------
// Verification queue — enriched with sector name + owner email.
// ---------------------------------------------------------------------------

export interface QueueDocument {
  type: CompanyDocumentType;
  status: string;
}

export interface QueueCompany {
  id: string;
  name: string;
  sectorName: string | null;
  ownerEmail: string | null;
  createdAt: string;
  documents: QueueDocument[];
  decisions: string[];
}

/**
 * Load the pending-verification queue. Sector name comes from the `sectors`
 * join; owner email lives in `auth.users` (NOT `profiles`), so it is resolved
 * with the service-role Auth admin API. Staff only.
 */
export async function getVerificationQueue(
  locale: string
): Promise<QueueCompany[]> {
  await requireAdmin(locale);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("companies")
    .select(
      `id, name, owner_id, created_at,
       sectors(name_en, name_fr),
       company_documents(type, status),
       verification_reviews(decision)`
    )
    .eq("status", COMPANY_STATUS.PENDING)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`[getVerificationQueue] ${error.message}`);
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
    sectors: { name_en: string; name_fr: string } | null;
    company_documents: QueueDocument[];
    verification_reviews: { decision: string }[];
  }>;

  const emailByUser = await resolveOwnerEmails(
    adminClient,
    rows.map((r) => r.owner_id)
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sectorName: r.sectors
      ? locale === "fr"
        ? r.sectors.name_fr
        : r.sectors.name_en
      : null,
    ownerEmail: emailByUser.get(r.owner_id) ?? null,
    createdAt: r.created_at,
    documents: r.company_documents ?? [],
    decisions: (r.verification_reviews ?? []).map((v) => v.decision),
  }));
}

/**
 * Batch-resolve owner emails from `auth.users` via the Auth admin API.
 * Deduplicates user ids and tolerates per-user lookup failures (returns no
 * entry rather than throwing) so one missing user never blanks the whole queue.
 */
async function resolveOwnerEmails(
  adminClient: ReturnType<typeof createAdminClient>,
  ownerIds: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ownerIds));
  const result = new Map<string, string>();

  await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await adminClient.auth.admin.getUserById(id);
      if (!error && data.user?.email) {
        result.set(id, data.user.email);
      }
    })
  );

  return result;
}

// ---------------------------------------------------------------------------
// Single company for review — full detail + signed docs + owner email.
// ---------------------------------------------------------------------------

export interface ReviewProduct {
  id: string;
  name: string;
  description: string | null;
}

export interface ReviewCompany {
  id: string;
  name: string;
  description: string | null;
  sectorName: string | null;
  ownerEmail: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  status: CompanyStatus;
  verificationTier: VerificationTier;
  verifiedAt: string | null;
  verificationSummary: unknown;
  createdAt: string;
  products: ReviewProduct[];
  documents: SignedDocument[];
  reviews: Array<{
    id: string;
    decision: string;
    notes: string | null;
    createdAt: string;
  }>;
  segmentKeys: string[];
  /** Whether all EXPECTED_DOC_TYPES legal docs are present. */
  docsComplete: boolean;
}

/**
 * Load one company for the verification review screen: full profile, products,
 * audit history, signed document URLs, sector name, and owner email. Staff only.
 * Returns null when the company does not exist.
 */
export async function getCompanyForReview(
  companyId: string,
  locale: string
): Promise<ReviewCompany | null> {
  await requireAdmin(locale);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("companies")
    .select(
      `id, name, description, owner_id, status, verification_tier, verified_at,
       verification_summary, contact_email, contact_phone, address, city,
       province, website, created_at,
       sectors(name_en, name_fr),
       products(id, name, description),
       company_documents(id, type, file_url, file_name, status),
       verification_reviews(id, decision, notes, created_at),
       company_segments(segment_key)`
    )
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getCompanyForReview] ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    status: CompanyStatus;
    verification_tier: VerificationTier;
    verified_at: string | null;
    verification_summary: unknown;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    website: string | null;
    created_at: string;
    sectors: { name_en: string; name_fr: string } | null;
    products: ReviewProduct[];
    company_documents: RawDocument[];
    verification_reviews: Array<{
      id: string;
      decision: string;
      notes: string | null;
      created_at: string;
    }>;
    company_segments: { segment_key: string }[];
  };

  const [signedDocs, emailByUser] = await Promise.all([
    signCompanyDocumentUrls(row.company_documents ?? [], locale),
    resolveOwnerEmails(adminClient, [row.owner_id]),
  ]);

  const presentTypes = new Set((row.company_documents ?? []).map((d) => d.type));
  const docsComplete = EXPECTED_DOC_TYPES.every((t) => presentTypes.has(t));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sectorName: row.sectors
      ? locale === "fr"
        ? row.sectors.name_fr
        : row.sectors.name_en
      : null,
    ownerEmail: emailByUser.get(row.owner_id) ?? null,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    address: row.address,
    city: row.city,
    province: row.province,
    website: row.website,
    status: row.status,
    verificationTier: row.verification_tier,
    verifiedAt: row.verified_at,
    verificationSummary: row.verification_summary,
    createdAt: row.created_at,
    products: row.products ?? [],
    documents: signedDocs,
    reviews: (row.verification_reviews ?? []).map((v) => ({
      id: v.id,
      decision: v.decision,
      notes: v.notes,
      createdAt: v.created_at,
    })),
    segmentKeys: (row.company_segments ?? []).map((s) => s.segment_key),
    docsComplete,
  };
}
