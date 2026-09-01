import type { OpportunityCategory } from "./categories";

export type OpportunityStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "expired";

export interface Opportunity {
  id: string;
  company_id: string;
  category: OpportunityCategory;
  slug: string;
  title_en: string;
  title_fr: string;
  summary_en: string;
  summary_fr: string;
  body_en: string;
  body_fr: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string | null;
  deadline_at: string | null;
  sector_id: string | null;
  region: string | null;
  status: OpportunityStatus;
  rejected_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
