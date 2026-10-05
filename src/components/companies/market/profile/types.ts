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

/** A tag or an HS code attached to the company, with its localized names. */
export interface ProfileLabel {
  id: string;
  /** HS codes only. */
  code?: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
}

export interface ProfileMedia {
  id: string;
  kind: "gallery" | "brochure" | "video";
  url: string;
  title_en: string | null;
  title_fr: string | null;
}

/**
 * The registration facts a buyer may read, served by `company_public_facts`
 * (00061). The rest of `verification_summary` never reaches the browser.
 */
export interface ProfileFacts {
  tradingName: string | null;
  yearEstablished: string | null;
  legalForm: string | null;
  employees: string | null;
}

export interface CompanyProfileData {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  /** Country of registration — not every company is Congolese. */
  country: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string | null;
  contact_visibility: ContactVisibility;
  verification_tier: VerificationTier;
  is_premium: boolean;
  production_capacity: string | null;
  moq: string | null;
  lead_time: string | null;
  certifications: string[];
  markets: string[];
  spoken_languages: string[];
  verified_at: string | null;
  facts: ProfileFacts;
  sector: ProfileSector | null;
  tags: ProfileLabel[];
  hsCodes: ProfileLabel[];
  media: ProfileMedia[];
  products: ProfileProduct[];
}
