import type { VerificationTier } from "@/lib/trust/types";

export type SearchEntityType = "company" | "product" | "service" | "opportunity" | "content" | "report";

export interface SearchResult {
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  snippet: string;
  href: string;
  rank: number;
  /** Trust tier of the owning company; only populated for product results. */
  verification_tier: VerificationTier | null;
}
