export const COMPANY_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const DOCUMENT_TYPE = {
  BUSINESS_LICENSE: 'business_license',
  TAX_REGISTRATION: 'tax_registration',
  PROOF_OF_ADDRESS: 'proof_of_address',
  LOGO: 'logo',
  PHOTO: 'photo',
  ADDITIONAL_DOCUMENT: 'additional_document',
} as const;

/**
 * Canonical KYB document types the verification queue inspects for completeness.
 * Mirrors the DB CHECK on `company_documents.type` (migration 00011, widened by
 * 00044), restricted to the three *legal* docs a reviewer must see before
 * approving — `logo`/`photo`/`additional_document` are branding assets or an
 * unvalidated optional catch-all, not verification evidence, so they are
 * excluded from the completeness dots.
 */
export const EXPECTED_DOC_TYPES = [
  DOCUMENT_TYPE.BUSINESS_LICENSE,
  DOCUMENT_TYPE.TAX_REGISTRATION,
  DOCUMENT_TYPE.PROOF_OF_ADDRESS,
] as const;

/**
 * Canonical verification tiers (companies.verification_tier — migration 00011).
 * `verified`/`premium` render the "Verified by Ministry" trust badge. This is
 * the public, canonical trust signal; there is intentionally NO
 * `companies.verified` boolean.
 */
export const VERIFICATION_TIER = {
  NONE: 'none',
  BASIC: 'basic',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
} as const;

export const VERIFICATION_TIERS = [
  VERIFICATION_TIER.NONE,
  VERIFICATION_TIER.BASIC,
  VERIFICATION_TIER.VERIFIED,
  VERIFICATION_TIER.PREMIUM,
] as const;

/**
 * Audit decisions written to `verification_reviews.decision`. Mirrors the DB
 * CHECK in migration 00001. Note the canonical "request more info" value is
 * `more_info_requested`; `resubmitted` is recorded by the owner re-submission
 * flow, not the admin decision panel.
 */
export const VERIFICATION_DECISION = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MORE_INFO_REQUESTED: 'more_info_requested',
  RESUBMITTED: 'resubmitted',
} as const;

export const RFQ_TYPE = {
  SUPPLY: 'supply',
  DEMAND: 'demand',
} as const;

export const RFQ_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CLOSED: 'closed',
} as const;

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];
export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];
export type ExpectedDocType = (typeof EXPECTED_DOC_TYPES)[number];
export type VerificationTier = (typeof VERIFICATION_TIER)[keyof typeof VERIFICATION_TIER];
export type VerificationDecision = (typeof VERIFICATION_DECISION)[keyof typeof VERIFICATION_DECISION];
export type RfqType = (typeof RFQ_TYPE)[keyof typeof RFQ_TYPE];
export type RfqStatus = (typeof RFQ_STATUS)[keyof typeof RFQ_STATUS];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
