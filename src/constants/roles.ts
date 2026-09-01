/**
 * Canonical RBAC role model for TradeInDRC.
 *
 * Mirrors migration 00013_rbac_roles.sql. The spec mandates five roles:
 *
 *   Visitor                -> no `profiles` row (anonymous / unauthenticated)
 *   Congolese Company       -> profiles.account_type = 'congolese_company'
 *   International Business  -> profiles.account_type = 'international_business'
 *   Moderator               -> profiles.staff_role = 'moderator'
 *   Super-Admin             -> profiles.staff_role = 'super_admin'
 *
 * `staff_role` is the source of truth for staff privilege. The legacy
 * `profiles.role` ('user' | 'admin') is kept only for back-compat and is NOT
 * the canonical signal here — staff predicates read `staff_role`, falling back
 * to the legacy `role` only for rows not yet migrated by 00013 step 2.
 *
 * RLS (not these helpers) is the source of truth for authorization. These
 * predicates power UI gating and labels only.
 */

import type { AccountType, StaffRole } from "@/lib/supabase/types";

/** Business account classification (profiles.account_type). */
export const ACCOUNT_TYPE = {
  CONGOLESE_COMPANY: "congolese_company",
  INTERNATIONAL_BUSINESS: "international_business",
} as const;

/** Staff privilege tier (profiles.staff_role). */
export const STAFF_ROLE = {
  MODERATOR: "moderator",
  SUPER_ADMIN: "super_admin",
} as const;

/** Legacy single-axis role kept for back-compat (profiles.role). */
export const LEGACY_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type LegacyRole = (typeof LEGACY_ROLE)[keyof typeof LEGACY_ROLE];

/**
 * The five distinct roles the UI reasons about. `visitor` has no `profiles`
 * row; the other four are derived from `account_type` + `staff_role`.
 */
export const APP_ROLE = {
  VISITOR: "visitor",
  CONGOLESE_COMPANY: "congolese_company",
  INTERNATIONAL_BUSINESS: "international_business",
  MODERATOR: "moderator",
  SUPER_ADMIN: "super_admin",
} as const;

export type AppRole = (typeof APP_ROLE)[keyof typeof APP_ROLE];

/** The subset of fields needed to resolve a role from a profile row. */
export interface RoleProfile {
  account_type: AccountType | null;
  staff_role: StaffRole | null;
  /** Legacy single-axis role; honoured only as a fallback for staff. */
  role?: LegacyRole | string | null;
}

/**
 * i18n key suffixes for each role label. Consumers translate via
 * `t(`roles.${ROLE_LABEL_KEY[role]}`)` under their own namespace so the model
 * stays free of hardcoded English/French.
 */
export const ROLE_LABEL_KEY: Record<AppRole, string> = {
  [APP_ROLE.VISITOR]: "visitor",
  [APP_ROLE.CONGOLESE_COMPANY]: "congoleseCompany",
  [APP_ROLE.INTERNATIONAL_BUSINESS]: "internationalBusiness",
  [APP_ROLE.MODERATOR]: "moderator",
  [APP_ROLE.SUPER_ADMIN]: "superAdmin",
};

/** True when the profile is a moderator (and not a super-admin). */
export function isModerator(profile: RoleProfile | null | undefined): boolean {
  return profile?.staff_role === STAFF_ROLE.MODERATOR;
}

/** True when the profile is a super-admin. */
export function isSuperAdmin(profile: RoleProfile | null | undefined): boolean {
  return profile?.staff_role === STAFF_ROLE.SUPER_ADMIN;
}

/**
 * True when the profile has any staff privilege (moderator OR super-admin).
 * Mirrors the SQL `is_admin()` helper: honours `staff_role` first, then the
 * legacy `role = 'admin'` for rows not yet migrated.
 */
export function isAdmin(profile: RoleProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    isModerator(profile) ||
    isSuperAdmin(profile) ||
    profile.role === LEGACY_ROLE.ADMIN
  );
}

/** Resolve a profile row to one of the five canonical app roles. */
export function resolveRole(profile: RoleProfile | null | undefined): AppRole {
  if (!profile) return APP_ROLE.VISITOR;
  if (isSuperAdmin(profile)) return APP_ROLE.SUPER_ADMIN;
  if (isModerator(profile)) return APP_ROLE.MODERATOR;
  // Legacy admins (pre-00013) with no staff_role still surface as super-admin.
  if (profile.role === LEGACY_ROLE.ADMIN) return APP_ROLE.SUPER_ADMIN;
  if (profile.account_type === ACCOUNT_TYPE.CONGOLESE_COMPANY) {
    return APP_ROLE.CONGOLESE_COMPANY;
  }
  if (profile.account_type === ACCOUNT_TYPE.INTERNATIONAL_BUSINESS) {
    return APP_ROLE.INTERNATIONAL_BUSINESS;
  }
  return APP_ROLE.VISITOR;
}
