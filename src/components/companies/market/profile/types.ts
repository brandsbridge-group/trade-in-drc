import type { VerificationTier } from "@/lib/trust/types";
import type { ContactVisibility } from "@/lib/supabase/types";

export interface ProfileSector {
  id: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
}

export interface ProfileProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
}

/**
 * A single verification-area row, optionally sourced from the
 * `companies.verification_summary` JSON. When the JSON is absent we render a
 * static set of areas whose status is derived from the verification tier.
 */
export interface VerificationRow {
  area: string;
  reviewed: boolean;
}

export interface CompanyProfileData {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  city: string | null;
  province: string | null;
  /** Country of registration — not every company is Congolese. */
  country: string | null;
  website: string | null;
  logo_url: string | null;
  contact_visibility: ContactVisibility;
  verification_tier: VerificationTier;
  is_premium: boolean;
  premium_plan: string | null;
  production_capacity: string | null;
  moq: string | null;
  lead_time: string | null;
  certifications: string[];
  markets: string[];
  spoken_languages: string[];
  verified_at: string | null;
  updated_at: string | null;
  verification_summary: unknown;
  sector: ProfileSector | null;
  products: ProfileProduct[];
}
